"use client";

import type { KeyboardEvent } from "react";
import { CheckCircle2, Eye, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MockFlashcardProps = {
  eyebrow: string;
  question: string;
  className?: string;
  variant?: "answer" | "reveal" | "choice" | "type";

  // "answer" / "reveal" -- click/Enter/Space to flip. Controlled: only
  // flips when `onFlip` is passed (see ProductPreview and
  // AiFeatureShowcase); otherwise renders as a static illustration, same
  // as before any of this existed.
  answer?: string;
  flipped?: boolean;
  onFlip?: () => void;
  /** Front-face hint for the "answer" variant (no icon). */
  flipHint?: string;
  /** Front-face hint for the "reveal" variant (shown with an eye icon,
   * both when flippable and in the static fallback with no `onFlip`). */
  revealHint?: string;

  // "choice" -- controlled selection with correct/incorrect styling,
  // mirroring the real study session's MultipleChoiceCard.
  options?: string[];
  selectedOption?: number | null;
  onSelect?: (index: number) => void;
  correctOption?: number;

  // "type" -- controlled input + submit, mirroring the real study
  // session's TypedAnswerCard. `feedback` is a fully-localized line the
  // caller composes (it already knows the correct answer text and can
  // build "Correct!"/"Not quite, it was X" without this component needing
  // its own i18n namespace).
  typePlaceholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  submitted?: boolean;
  correct?: boolean;
  feedback?: string;
  submitLabel?: string;
};

function CardEyebrow({ eyebrow, sparkle = true, className }: { eyebrow: string; sparkle?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="rounded-full bg-brand-mint/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-turquoise">
        {eyebrow}
      </span>
      {sparkle ? <Sparkles className="size-3.5 shrink-0 text-brand-accent" aria-hidden="true" /> : null}
    </div>
  );
}

/** Illustrative mock of a flashcard, standing in for the real study UI --
 * but for every variant, genuinely interactive rather than a static
 * picture of the interaction: "answer"/"reveal" click-to-flip, "choice"
 * click-to-select with correctness, "type" type-and-submit with
 * correctness, each mirroring its real StudySession counterpart
 * (BasicCard/MultipleChoiceCard/TypedAnswerCard) on a smaller scale. Each
 * interactive path only activates when its controlling props are passed
 * (`onFlip`, `onSelect`, `onSubmit`); omit them for a plain static
 * illustration. */
export function MockFlashcard({
  eyebrow,
  question,
  className,
  variant = "answer",
  answer,
  flipped = false,
  onFlip,
  flipHint,
  revealHint,
  options,
  selectedOption = null,
  onSelect,
  correctOption,
  typePlaceholder,
  value = "",
  onChange,
  onSubmit,
  submitted = false,
  correct = false,
  feedback,
  submitLabel,
}: MockFlashcardProps) {
  if ((variant === "answer" || variant === "reveal") && onFlip) {
    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onFlip?.();
      }
    }

    return (
      <div className={cn("[perspective:1200px]", className)}>
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          onClick={onFlip}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative h-full min-h-40 w-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <div
            aria-hidden={flipped}
            className="absolute inset-0 flex flex-col rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)] [backface-visibility:hidden]"
          >
            <CardEyebrow eyebrow={eyebrow} />
            <p className="mt-4 font-heading text-base font-semibold text-foreground">{question}</p>
            {variant === "reveal" && revealHint ? (
              <span className="mt-auto flex w-fit items-center gap-1.5 pt-3 text-xs font-medium text-foreground-muted/70">
                <Eye className="size-3.5 shrink-0" aria-hidden="true" />
                {revealHint}
              </span>
            ) : flipHint ? (
              <p className="mt-auto w-fit pt-3 text-xs font-medium text-foreground-muted/70">{flipHint}</p>
            ) : null}
          </div>

          <div
            aria-hidden={!flipped}
            className="absolute inset-0 flex flex-col rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <CardEyebrow eyebrow={eyebrow} sparkle={false} className="self-start" />
            <p className="mt-4 text-sm text-foreground-muted">{answer}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <CardEyebrow eyebrow={eyebrow} />

      <p className="mt-4 font-heading text-base font-semibold text-foreground">
        {question}
      </p>

      <div className="mt-3 flex-1">
        {variant === "choice" && options ? (
          <div className="grid grid-cols-2 gap-2">
            {options.map((option, index) => {
              const isAnswered = selectedOption !== null;
              const isSelected = selectedOption === index;
              const isCorrect = index === correctOption;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => onSelect?.(index)}
                  className={cn(
                    "rounded-md border px-2.5 py-2 text-center text-xs font-medium transition-colors",
                    isAnswered && isCorrect && "border-success bg-success/10 text-success",
                    isAnswered && isSelected && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                    isAnswered && !isSelected && !isCorrect && "border-border bg-surface-muted/60 text-foreground-muted/50",
                    !isAnswered &&
                      "border-border bg-surface-muted/60 text-foreground-muted hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : variant === "type" ? (
          <div className="space-y-2">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!submitted && value.trim()) onSubmit?.();
              }}
              className="flex gap-2"
            >
              <Input
                value={value}
                onChange={(event) => onChange?.(event.target.value)}
                disabled={submitted}
                placeholder={typePlaceholder}
                className="text-sm"
              />
              {!submitted ? (
                <Button type="submit" size="xs" disabled={!value.trim()} className="shrink-0">
                  {submitLabel}
                </Button>
              ) : null}
            </form>
            {submitted && feedback ? (
              <p
                className={cn(
                  "flex items-start gap-1.5 text-xs font-medium",
                  correct ? "text-success" : "text-destructive",
                )}
              >
                {correct ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                )}
                {feedback}
              </p>
            ) : null}
          </div>
        ) : variant === "reveal" ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
            <Eye className="size-3.5" aria-hidden="true" />
            {revealHint}
          </span>
        ) : answer ? (
          <p className="text-sm text-foreground-muted">{answer}</p>
        ) : null}
      </div>
    </div>
  );
}
