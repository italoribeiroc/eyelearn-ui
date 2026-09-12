"use client";

import type { KeyboardEvent } from "react";
import { Eye } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { MediaDisplay } from "@/components/flashcards/media-display";
import { RichTextContent } from "@/components/flashcards/rich-text-content";
import { RatingButtons } from "@/components/flashcards/study/rating-buttons";
import { cn } from "@/lib/utils";
import type { FlashcardMediaItem, ReviewRating, ReviewResult } from "@/lib/api/types";

/**
 * Flip-animation alternative to BasicCard's plain "Show answer" button --
 * same landing-page mechanic as MockFlashcard/HeroPreviewCard (perspective
 * + 3D rotateY + backface-visibility, click/Enter/Space activated), but
 * with two changes needed for a real study tool rather than a marketing
 * demo:
 *
 * 1. Both faces are stacked in the same CSS Grid cell ([grid-area:1/1])
 *    instead of absolutely positioned, so the container auto-sizes to
 *    whichever face is taller instead of relying on a fixed min-height or
 *    on one face happening to be shorter -- real content (rich text +
 *    optional media) varies unpredictably, unlike the marketing
 *    components' fixed demo copy.
 * 2. The flip is two-way: tapping/pressing Enter again on the answer face
 *    flips back to the question, so a misclick (or just wanting to
 *    re-read the prompt before rating) doesn't require the undo/"Go back"
 *    review-undo flow -- this is a purely client-side visual toggle, no
 *    server call, independent of that other "Go back" button.
 *
 * `revealed` is the same boolean StudySession already owns for BasicCard --
 * this component doesn't introduce new state, only a different
 * presentation of the same reveal moment, so undo/next/reset all keep
 * working unchanged (see study-session.tsx).
 */
export function FlipBasicCard({
  prompt,
  promptMedia,
  answer,
  answerMedia,
  revealed,
  onToggle,
  result,
  submitting,
  onRate,
}: {
  prompt: string;
  promptMedia: FlashcardMediaItem[];
  answer: string;
  answerMedia: FlashcardMediaItem[];
  revealed: boolean;
  onToggle: () => void;
  result: ReviewResult | null;
  submitting: boolean;
  onRate: (rating: ReviewRating) => void;
}) {
  const t = useTranslations("flashcards.study");
  const prefersReducedMotion = useReducedMotion();

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <div className="mt-4">
      <div className="[perspective:1200px]">
        <div
          role="button"
          tabIndex={0}
          aria-pressed={revealed}
          aria-label={revealed ? t("cardStyle.flipBackHint") : t("cardStyle.flipHint")}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            "grid w-full cursor-pointer [transform-style:preserve-3d]",
            !prefersReducedMotion && "transition-transform duration-500",
            revealed && "[transform:rotateY(180deg)]",
          )}
        >
          <div
            aria-hidden={revealed}
            className="[grid-area:1/1] flex flex-col rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft)] [backface-visibility:hidden]"
          >
            <RichTextContent html={prompt} className="font-heading text-xl font-semibold text-foreground" />
            <MediaDisplay items={promptMedia} />
            <span className="mt-auto flex w-fit items-center gap-1.5 pt-3 text-xs font-medium text-foreground-muted/70">
              <Eye className="size-3.5 shrink-0" aria-hidden="true" />
              {t("cardStyle.flipHint")}
            </span>
          </div>

          <div
            aria-hidden={!revealed}
            className="[grid-area:1/1] flex flex-col rounded-lg border border-border bg-surface-muted p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <RichTextContent html={answer} className="text-sm text-foreground" />
            <MediaDisplay items={answerMedia} />
            <span className="mt-auto flex w-fit items-center gap-1.5 pt-3 text-xs font-medium text-foreground-muted/70">
              <Eye className="size-3.5 shrink-0" aria-hidden="true" />
              {t("cardStyle.flipBackHint")}
            </span>
          </div>
        </div>
      </div>

      {revealed ? (
        <div className="mt-4">
          <RatingButtons result={result} submitting={submitting} onRate={onRate} />
        </div>
      ) : null}
    </div>
  );
}
