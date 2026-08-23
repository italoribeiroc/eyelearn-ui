import JSZip from "jszip";
// The asm.js build (pure JavaScript, no .wasm asset) is used deliberately --
// it avoids having to get a WebAssembly binary bundled/located correctly
// inside a Vercel serverless function, at the cost of being a bit slower.
// Fine for parsing a single collection.anki2 file per import request.
import initSqlJs from "sql.js/dist/sql-asm.js";
import type { ImportRow } from "./import";

type AnkiNoteType = {
  id: number;
  name: string;
  type: number; // 0 = standard, 1 = cloze
  flds: { name: string; ord: number }[];
};

let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null;

function getSqlJs() {
  if (!sqlJsPromise) sqlJsPromise = initSqlJs();
  return sqlJsPromise;
}

const SQLITE_MAGIC = "SQLite format 3\0";

function stripAnkiField(raw: string): string {
  return raw
    .replace(/\[sound:[^\]]*\]/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export type ApkgParseResult = {
  rows: ImportRow[];
  /** Notes dropped because they're cloze deletions or don't have exactly 2 fields (Front/Back-shaped). */
  skippedNotes: number;
};

/**
 * Best-effort .apkg reader: extracts simple two-field (Front/Back-shaped)
 * standard note types as BASIC flashcards. Cloze deletions, note types with
 * more or fewer than 2 fields, and media (images/audio) are not imported --
 * media references are stripped from the text rather than uploaded, since
 * that would need the presigned-upload flow run per file. This covers the
 * common case (plain Q/A decks) without attempting full Anki fidelity.
 */
export async function parseApkg(buffer: Buffer): Promise<ApkgParseResult> {
  const zip = await JSZip.loadAsync(buffer);

  const dbEntry = zip.file("collection.anki21") ?? zip.file("collection.anki2");
  if (!dbEntry) {
    if (zip.file("collection.anki21b")) {
      throw new Error(
        "This .apkg uses Anki's newer compressed format. Re-export it from Anki with " +
          '"Support older Anki versions" checked, then try again.',
      );
    }
    throw new Error("No Anki collection found inside this .apkg file.");
  }

  const bytes = await dbEntry.async("uint8array");
  const header = Buffer.from(bytes.slice(0, SQLITE_MAGIC.length)).toString("latin1");
  if (header !== SQLITE_MAGIC) {
    throw new Error("This .apkg's collection file isn't a readable SQLite database.");
  }

  const SQL = await getSqlJs();
  const db = new SQL.Database(bytes);

  try {
    const colResult = db.exec("SELECT models FROM col LIMIT 1");
    const modelsJson = colResult[0]?.values[0]?.[0];
    if (typeof modelsJson !== "string") {
      throw new Error("Couldn't read note types from this .apkg file.");
    }

    const models = JSON.parse(modelsJson) as Record<string, AnkiNoteType>;
    const notesResult = db.exec("SELECT mid, flds FROM notes");
    const noteRows = notesResult[0]?.values ?? [];

    const rows: ImportRow[] = [];
    let skippedNotes = 0;

    for (const [mid, flds] of noteRows) {
      const notetype = models[String(mid)];
      const fields = typeof flds === "string" ? flds.split("\x1f") : [];

      if (!notetype || notetype.type !== 0 || fields.length !== 2) {
        skippedNotes += 1;
        continue;
      }

      const prompt = stripAnkiField(fields[0] ?? "");
      const answer = stripAnkiField(fields[1] ?? "");
      if (!prompt) {
        skippedNotes += 1;
        continue;
      }

      rows.push({ card_type: "basic", prompt, answer });
    }

    return { rows, skippedNotes };
  } finally {
    db.close();
  }
}
