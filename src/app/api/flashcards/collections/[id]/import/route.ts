import { NextResponse } from "next/server";
import { createFlashcard } from "@/lib/flashcards/api";
import { parseApkg } from "@/lib/flashcards/apkg";
import { parseDelimitedImport, type ImportRow } from "@/lib/flashcards/import";

export type ImportSummary = {
  created: number;
  skipped: number;
  errors: string[];
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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collectionId = Number(id);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "No file provided." }, { status: 400 });
  }

  const filename = file.name.toLowerCase();
  let rows: ImportRow[];
  const summary: ImportSummary = { created: 0, skipped: 0, errors: [] };

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

  for (const row of rows) {
    const invalidReason = isValidRow(row);
    if (invalidReason) {
      summary.skipped += 1;
      if (summary.errors.length < 20) summary.errors.push(invalidReason);
      continue;
    }

    try {
      await createFlashcard(collectionId, {
        card_type: row.card_type,
        prompt: row.prompt.trim(),
        answer: row.answer?.trim(),
        options: row.options,
        accepted_answers: row.accepted_answers,
      });
      summary.created += 1;
    } catch {
      summary.skipped += 1;
      if (summary.errors.length < 20) summary.errors.push(`"${row.prompt}": failed to save`);
    }
  }

  return NextResponse.json(summary);
}
