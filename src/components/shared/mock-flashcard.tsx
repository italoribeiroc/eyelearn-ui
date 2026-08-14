import { Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MockFlashcardProps = {
  eyebrow: string;
  question: string;
  className?: string;
} & (
  | { variant?: "answer"; answer?: string; revealHint?: never; options?: never; typePlaceholder?: never }
  | { variant: "reveal"; revealHint: string; answer?: never; options?: never; typePlaceholder?: never }
  | { variant: "choice"; options: string[]; answer?: never; revealHint?: never; typePlaceholder?: never }
  | { variant: "type"; typePlaceholder: string; answer?: never; revealHint?: never; options?: never }
);

/** Illustrative mock of a flashcard, standing in for the real (not-yet-built) study UI. */
export function MockFlashcard({
  eyebrow,
  question,
  className,
  ...props
}: MockFlashcardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand-mint/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-turquoise">
          {eyebrow}
        </span>
        <Sparkles className="size-3.5 shrink-0 text-brand-accent" aria-hidden="true" />
      </div>

      <p className="mt-4 font-heading text-base font-semibold text-foreground">
        {question}
      </p>

      <div className="mt-3 flex-1">
        {props.variant === "choice" ? (
          <div className="grid grid-cols-2 gap-2">
            {props.options.map((option) => (
              <span
                key={option}
                className="rounded-md border border-border bg-surface-muted/60 px-2.5 py-2 text-center text-xs font-medium text-foreground-muted"
              >
                {option}
              </span>
            ))}
          </div>
        ) : props.variant === "type" ? (
          <span className="block rounded-md border border-dashed border-border bg-surface-muted/50 px-3 py-2.5 text-sm text-foreground-muted/70">
            {props.typePlaceholder}
          </span>
        ) : props.variant === "reveal" ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
            <Eye className="size-3.5" aria-hidden="true" />
            {props.revealHint}
          </span>
        ) : props.answer ? (
          <p className="text-sm text-foreground-muted">{props.answer}</p>
        ) : null}
      </div>
    </div>
  );
}
