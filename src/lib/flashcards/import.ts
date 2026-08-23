import { detectDelimiter, parseDelimited } from "./csv";
import type { CardType, FlashcardOption } from "@/lib/api/types";

export type ImportRow = {
  card_type: CardType;
  prompt: string;
  answer?: string;
  options?: FlashcardOption[];
  accepted_answers?: string[];
};

const RICH_HEADER = ["card_type", "prompt", "answer", "options", "accepted_answers"];
const CARD_TYPES: CardType[] = ["basic", "multiple_choice", "typed_answer"];

/**
 * Parses a CSV/TSV file into import rows. Recognizes this app's own export
 * header (card_type,prompt,answer,options,accepted_answers) for a full
 * round-trip; otherwise falls back to treating every row as a plain
 * front/back pair (prompt, answer) -- the same shape as a spreadsheet export
 * or Anki's "Notes in Plain Text" export, so those can be pasted in directly.
 */
export function parseDelimitedImport(text: string): ImportRow[] {
  const delimiter = detectDelimiter(text);
  const rows = parseDelimited(text, delimiter);
  if (rows.length === 0) return [];

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const isRichFormat = RICH_HEADER.every((column) => header.includes(column));

  const dataRows = isRichFormat || looksLikeHeader(rows[0]) ? rows.slice(1) : rows;

  if (isRichFormat) {
    const columnIndex = Object.fromEntries(RICH_HEADER.map((column) => [column, header.indexOf(column)]));
    return dataRows
      .filter((row) => row.some((cell) => cell.trim()))
      .map((row) => {
        const cardType = row[columnIndex.card_type]?.trim() as CardType;
        const optionsCell = row[columnIndex.options]?.trim();
        const acceptedCell = row[columnIndex.accepted_answers]?.trim();

        return {
          card_type: CARD_TYPES.includes(cardType) ? cardType : "basic",
          prompt: row[columnIndex.prompt]?.trim() ?? "",
          answer: row[columnIndex.answer]?.trim() ?? "",
          options: optionsCell ? safeParseOptions(optionsCell) : undefined,
          accepted_answers: acceptedCell
            ? acceptedCell.split(";").map((value) => value.trim()).filter(Boolean)
            : undefined,
        };
      });
  }

  return dataRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => ({
      card_type: "basic" as const,
      prompt: row[0]?.trim() ?? "",
      answer: row[1]?.trim() ?? "",
    }));
}

function looksLikeHeader(row: string[]): boolean {
  const normalized = row.map((cell) => cell.trim().toLowerCase());
  return (
    (normalized[0] === "front" || normalized[0] === "prompt" || normalized[0] === "question") &&
    (normalized[1] === "back" || normalized[1] === "answer")
  );
}

function safeParseOptions(raw: string): FlashcardOption[] | undefined {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .filter((item): item is { text?: unknown; is_correct?: unknown } => typeof item === "object" && item !== null)
      .map((item) => ({ text: String(item.text ?? ""), is_correct: Boolean(item.is_correct) }));
  } catch {
    return undefined;
  }
}
