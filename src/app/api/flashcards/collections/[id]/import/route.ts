import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth/session";
import { createFlashcardsBulk } from "@/lib/flashcards/api";
import { MAX_IMPORT_BATCH_SIZE, type ImportRow } from "@/lib/flashcards/import";

// A bulk-create request for a full batch normally finishes in well under a
// second (it's one Django request doing DB writes, not one request per
// card), but this still gives it room on a slow connection. 60s is the max
// maxDuration can reach on Vercel's Hobby tier.
export const maxDuration = 60;

export type ImportSummary = {
  created: number;
  skipped: number;
  errors: string[];
  /** True once the account's free-plan flashcard cap stopped the import early. */
  limitReached: boolean;
};

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

/**
 * Takes a batch of already-parsed rows -- never a raw file. The file itself
 * (.apkg or .csv/.tsv/.txt) is parsed entirely in the browser (see
 * import-export-menu.tsx) and split into batches of at most
 * MAX_IMPORT_BATCH_SIZE rows before ever reaching this route, specifically
 * so a large deck's actual file bytes (which can be tens of MB once a deck
 * has embedded audio/images, even though that media itself is never
 * uploaded here) never have to cross a serverless function's request-body
 * size limit -- only the much smaller extracted text does, in small
 * batches. Each batch's valid rows are then created via ONE Django request
 * (flashcard_bulk_create) rather than one request per card -- looping the
 * single-create endpoint here used to mean hundreds or thousands of Django
 * requests for one big import, which blew through the per-user rate limit
 * (120/min) long before a real deck finished. The client calls this once
 * per batch and aggregates the results itself; this route knows nothing
 * about the import as a whole, only the batch it was given.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getValidAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = Number(id);

  const body = (await request.json().catch(() => null)) as { rows?: unknown } | null;
  if (!body || !Array.isArray(body.rows)) {
    return NextResponse.json({ detail: "No rows provided." }, { status: 400 });
  }
  if (body.rows.length > MAX_IMPORT_BATCH_SIZE) {
    return NextResponse.json({ detail: `A batch can contain at most ${MAX_IMPORT_BATCH_SIZE} rows.` }, { status: 400 });
  }
  const rows = body.rows as ImportRow[];
  const summary: ImportSummary = { created: 0, skipped: 0, errors: [], limitReached: false };

  const validRows: ImportRow[] = [];
  for (const row of rows) {
    const invalidReason = isValidRow(row);
    if (invalidReason) {
      summary.skipped += 1;
      if (summary.errors.length < 20) summary.errors.push(invalidReason);
    } else {
      validRows.push(row);
    }
  }

  if (validRows.length > 0) {
    try {
      const result = await createFlashcardsBulk(
        collectionId,
        validRows.map((row) => ({
          card_type: row.card_type,
          prompt: row.prompt.trim(),
          answer: row.answer?.trim(),
          options: row.options,
          accepted_answers: row.accepted_answers,
        })),
      );
      summary.created += result.created.length;
      summary.skipped += result.errors.length;
      summary.limitReached = result.limit_reached;
      for (const cardError of result.errors) {
        if (summary.errors.length >= 20) break;
        const prompt = validRows[cardError.index]?.prompt ?? "?";
        summary.errors.push(`"${prompt}": failed to save`);
      }
    } catch {
      // The whole batch request itself failed (network blip, unexpected
      // 5xx) -- rather than lose track of these rows, count them all as
      // skipped so the running total the client shows stays accurate.
      summary.skipped += validRows.length;
      summary.errors.push("This batch failed to save.");
    }
  }

  return NextResponse.json(summary);
}
