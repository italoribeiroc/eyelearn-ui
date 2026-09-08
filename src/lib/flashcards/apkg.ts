import JSZip from "jszip";
// The asm.js build (pure JavaScript, no .wasm asset) is used deliberately --
// it avoids having to get a WebAssembly binary bundled/located correctly,
// at the cost of being a bit slower. This module runs entirely in the
// browser (see import-export-menu.tsx, which dynamic-imports it only when
// a .apkg is actually picked, keeping this out of the main client bundle)
// -- parsing client-side, rather than uploading the raw .apkg to a
// serverless function, is what avoids Vercel's request-body-size limit on
// large decks (previously a hard "FUNCTION_PAYLOAD_TOO_LARGE" 413 on any
// deck whose .apkg exceeded that limit, common once a deck has embedded
// audio/images).
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
  /** Notes dropped because they're cloze deletions or have fewer than 2 fields (can't form a Front/Back pair). */
  skippedNotes: number;
};

/**
 * Best-effort .apkg reader: extracts standard (non-cloze) note types as
 * BASIC flashcards, using the note's first field as the prompt and its
 * second as the answer. Most real-world Anki note types have more than 2
 * fields -- e.g. a vocabulary deck shaped Front/Back/Image/Audio -- so any
 * fields beyond the first two are simply ignored rather than treated as a
 * reason to skip the whole note; the common convention across Anki note
 * types (Basic, Basic-and-reversed, most community templates) is that field
 * 0 is the question side and field 1 is the answer side regardless of how
 * many more fields follow. Media (images/audio) is never imported -- media
 * references are stripped from the text rather than uploaded, since that
 * would need the presigned-upload flow run per file. This covers the common
 * case (plain Q/A decks, however many extra fields they carry) without
 * attempting full Anki fidelity (cloze deletions, card templates beyond the
 * first, or note types with only a single field are still skipped).
 */
export async function parseApkg(data: ArrayBuffer | Uint8Array): Promise<ApkgParseResult> {
  const zip = await JSZip.loadAsync(data);

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
  // Manual byte-to-char decoding (not Buffer, which isn't available in the
  // browser this now runs in) -- fine here since the magic header is plain ASCII.
  const header = Array.from(bytes.slice(0, SQLITE_MAGIC.length), (byte) => String.fromCharCode(byte)).join("");
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

      if (!notetype || notetype.type !== 0 || fields.length < 2) {
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
