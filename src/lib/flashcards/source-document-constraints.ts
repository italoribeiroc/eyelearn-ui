/** Mirrors flashcards/document_extraction.py's ALLOWED_CONTENT_TYPES / MAX_SIZE_BYTES
 * so bad files are caught client-side before an upload is even attempted. */
export const ALLOWED_SOURCE_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SourceDocumentContentType = (typeof ALLOWED_SOURCE_DOCUMENT_TYPES)[number];

export const MAX_SOURCE_DOCUMENT_SIZE_BYTES: Record<SourceDocumentContentType, number> = {
  "application/pdf": 20 * 1024 * 1024,
  "text/plain": 5 * 1024 * 1024,
  "text/markdown": 5 * 1024 * 1024,
  "text/x-markdown": 5 * 1024 * 1024,
  "image/jpeg": 10 * 1024 * 1024,
  "image/png": 10 * 1024 * 1024,
  "image/webp": 10 * 1024 * 1024,
};

// Matches MAX_SOURCE_DOCUMENTS_PER_REQUEST in flashcards/services.py.
export const MAX_SOURCE_DOCUMENTS_PER_REQUEST = 5;

export const SOURCE_DOCUMENT_ACCEPT =
  ".pdf,.txt,.md,application/pdf,text/plain,text/markdown,image/jpeg,image/png,image/webp";

/** Some browsers report an empty `file.type` for .md files -- fall back to
 * sniffing the extension so a real Markdown file isn't rejected client-side
 * even though the backend would have accepted it. */
export function inferSourceDocumentContentType(file: File): SourceDocumentContentType | null {
  if ((ALLOWED_SOURCE_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    return file.type as SourceDocumentContentType;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "text/markdown";
  if (name.endsWith(".txt")) return "text/plain";
  if (name.endsWith(".pdf")) return "application/pdf";
  return null;
}
