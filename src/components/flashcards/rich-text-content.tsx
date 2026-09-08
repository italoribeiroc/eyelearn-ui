import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

// Matches exactly what RichTextEditor's toolbar can produce (see its own
// extension list) -- nothing else is ever allowed through, regardless of
// what a card's prompt/answer actually contains (hand-typed via the rich
// editor, AI-generated plain text, or imported from a CSV/.apkg -- CSV
// import in particular never strips markup, so this is real defense, not
// just belt-and-suspenders). style is only needed for the color/highlight
// marks, which set it directly (color: ..., background-color: ...); no
// other inline styling is possible to produce via the editor, so nothing
// else needs to be allowed.
const ALLOWED_TAGS = ["p", "strong", "em", "u", "s", "code", "sup", "sub", "ul", "ol", "li", "mark", "br", "span"];
const ALLOWED_ATTR = ["style"];

/**
 * Renders flashcard prompt/answer HTML (see RichTextEditor) safely -- every
 * display surface (study session, draft review, card list previews) goes
 * through this, never a raw `dangerouslySetInnerHTML`, so a card imported
 * from an untrusted .apkg/CSV can't inject a script or an event handler.
 * `isomorphic-dompurify` (not the plain `dompurify` package) specifically
 * because this renders from both Server and Client Components -- plain
 * DOMPurify assumes a browser `window` and breaks during SSR. Sanitizing on
 * render (not on save) means tightening ALLOWED_TAGS later automatically
 * covers content saved before that change too.
 */
export function RichTextContent({ html, className }: { html: string; className?: string }) {
  const safeHtml = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });

  return (
    <div
      className={cn(
        "prose-sm max-w-none",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_p]:my-0",
        className,
      )}
      // Sanitized just above via ALLOWED_TAGS/ALLOWED_ATTR.
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

/** Plain-text version of a card's HTML, for contexts that can't render rich
 * content at all -- a `line-clamp`ed list preview, a `<title>`/aria-label,
 * or anywhere block-level markup (a bullet list, say) would look broken
 * once truncated. Strips tags rather than rendering and reading
 * `textContent`, so it works during SSR too (no DOM available there). */
export function stripRichTextToPlainText(html: string): string {
  return html
    .replace(/<(p|li|br)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
