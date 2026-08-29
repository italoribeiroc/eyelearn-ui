import { NextResponse } from "next/server";
import { DjangoApiError } from "@/lib/api/django-client";
import { getValidAccessToken } from "@/lib/auth/session";
import { createFlashcard } from "@/lib/flashcards/api";
import { parseApkg } from "@/lib/flashcards/apkg";
import { parseDelimitedImport, type ImportRow } from "@/lib/flashcards/import";

const MAX_IMPORT_FILE_BYTES = 20 * 1024 * 1024; // 20MB

export type ImportSummary = {
  created: number;
  skipped: number;
  errors: string[];
  /** True once the account's free-plan flashcard cap stopped the import early. */
  limitReached: boolean;
};

/** Newline-delimited JSON events streamed to the client as the import runs. */
export type ImportStreamEvent =
  | { type: "start"; total: number }
  | { type: "progress"; done: number; total: number }
  | { type: "done"; summary: ImportSummary };

function isValidRow(row: ImportRow): string | null {
  if (!row.prompt.trim()) return "Empty prompt";

  if (row.card_type === "multiple_choice") {
    const options = row.options ?? [];
    if (options.length < 2) return `"${row.prompt}": needs at least 2 options`;
    if (options.filter((option) => option.is_correct).length !== 1) {
      return `"${row.prompt}": needs exactly one correct option`;
    }
  }

  if (row.card_type === "typed_answer" && !row.answer?.trim()) {
    return `"${row.prompt}": typed-answer cards need an answer`;
  }

  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getValidAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_IMPORT_FILE_BYTES) {
    return NextResponse.json({ detail: "File is too large (max 20MB)." }, { status: 413 });
  }

  const { id } = await params;
  const collectionId = Number(id);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return NextResponse.json({ detail: "File is too large (max 20MB)." }, { status: 413 });
  }

  const filename = file.name.toLowerCase();
  let rows: ImportRow[];
  const summary: ImportSummary = { created: 0, skipped: 0, errors: [], limitReached: false };

  try {
    if (filename.endsWith(".apkg")) {
      const result = await parseApkg(Buffer.from(await file.arrayBuffer()));
      rows = result.rows;
      summary.skipped += result.skippedNotes;
      if (result.skippedNotes > 0) {
        summary.errors.push(
          `${result.skippedNotes} note(s) skipped (cloze deletions or note types with more than 2 fields aren't supported)`,
        );
      }
    } else {
      rows = parseDelimitedImport(await file.text());
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read that file.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }

  // Streamed as newline-delimited JSON so the client can render real
  // progress -- each row is its own sequential Django round-trip, which is
  // exactly where big imports spend most of their time.
  const encoder = new TextEncoder();
  const total = rows.length;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`${JSON.stringify({ type: "start", total })}\n`));

      for (const row of rows) {
        const invalidReason = isValidRow(row);
        if (invalidReason) {
          summary.skipped += 1;
          if (summary.errors.length < 20) summary.errors.push(invalidReason);
        } else {
          try {
            await createFlashcard(collectionId, {
              card_type: row.card_type,
              prompt: row.prompt.trim(),
              answer: row.answer?.trim(),
              options: row.options,
              accepted_answers: row.accepted_answers,
            });
            summary.created += 1;
          } catch (error) {
            if (error instanceof DjangoApiError && error.status === 402) {
              // Free-plan cap hit -- every remaining row would 402 too, so
              // stop attempting them and count them all as skipped.
              summary.limitReached = true;
              summary.skipped += rows.length - (summary.created + summary.skipped);
              break;
            }
            summary.skipped += 1;
            if (summary.errors.length < 20) summary.errors.push(`"${row.prompt}": failed to save`);
          }
        }

        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "progress", done: summary.created + summary.skipped, total })}\n`,
          ),
        );
      }

      controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done", summary })}\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
