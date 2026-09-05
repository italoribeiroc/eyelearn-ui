"use client";

import { useState, type CSSProperties } from "react";
import { CheckCircle2, PartyPopper, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaDisplay } from "@/components/flashcards/media-display";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type {
  FlashcardMediaItem,
  ReviewRating,
  ReviewResult,
  ReviewSchedulingState,
  ReviewSubmission,
  StudyQueueItem,
} from "@/lib/api/types";

// Same idea as RATING_STYLES below: color signals meaning at a glance.
// "new"/"learning" cards haven't stuck yet (mint/warning), "review" is a
// card that has graduated to the long-term schedule (success), and
// "relearning" flags one that was forgotten and needs attention (error).
const STATE_BADGE_STYLES: Record<ReviewSchedulingState, string> = {
  new: "bg-brand-mint/15 text-brand-turquoise",
  learning: "bg-warning/10 text-warning",
  review: "bg-success/10 text-success",
  relearning: "bg-error/10 text-error",
};

export const RATINGS: { value: ReviewRating; labelKey: string }[] = [
  { value: 1, labelKey: "again" },
  { value: 2, labelKey: "hard" },
  { value: 3, labelKey: "good" },
  { value: 4, labelKey: "easy" },
];

// Again -> Hard -> Good -> Easy on a red-to-green gradient, so the meaning
// of each button is visible at a glance (not just from its label). "Good"
// sits between the warning and success tokens with no named token of its
// own, so it's built with color-mix() instead of a new hardcoded hex value.
export const RATING_STYLES: Record<ReviewRating, { className?: string; style?: CSSProperties }> = {
  1: { className: "border-error bg-error/10 text-error hover:bg-error/15" },
  2: { className: "border-warning bg-warning/10 text-warning hover:bg-warning/15" },
  3: {
    style: {
      borderColor: "color-mix(in oklch, var(--color-warning), var(--color-success) 55%)",
      backgroundColor: "color-mix(in oklch, var(--color-warning), var(--color-success) 55%, transparent 90%)",
      color: "color-mix(in oklch, var(--color-warning), var(--color-success) 55%)",
    },
  },
  4: { className: "border-success bg-success/10 text-success hover:bg-success/15" },
};

async function postReview(flashcardId: number, submission: ReviewSubmission): Promise<ReviewResult> {
  const res = await fetch(`/api/flashcards/cards/${flashcardId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
  if (!res.ok) throw new Error("Failed to submit review");
  return res.json();
}

export function StudySession({
  title,
  backHref,
  backLabel,
  initialQueue,
}: {
  title: string;
  backHref: string;
  backLabel: string;
  initialQueue: StudyQueueItem[];
}) {
  const t = useTranslations("flashcards.study");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);

  const item = initialQueue[index];
  const isDone = index >= initialQueue.length;
  const completed = index + (result ? 1 : 0);

  function resetCardState() {
    setRevealed(false);
    setSelectedOption(null);
    setTypedAnswer("");
    setResult(null);
  }

  function goNext() {
    setIndex((i) => i + 1);
    resetCardState();
  }

  async function submit(submission: ReviewSubmission) {
    setSubmitting(true);
    try {
      const outcome = await postReview(item.flashcard.id, submission);
      setResult(outcome);
      setReviewedCount((c) => c + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-accent/15">
          <PartyPopper className="size-7 text-brand-accent" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("sessionCompleteTitle")}</h1>
        <p className="max-w-sm text-sm text-foreground-muted">
          {t("sessionCompleteDescription", { count: reviewedCount })}
        </p>
        <Button asChild>
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm text-foreground-muted">{title}</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
            {t("progressLabel")}
          </span>
          <span className="text-foreground-muted">
            {t("progressCount", { current: completed, total: initialQueue.length })}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-turquoise to-brand-mint transition-all"
            style={{ width: `${(completed / initialQueue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            STATE_BADGE_STYLES[item.state],
          )}
        >
          {t(`states.${item.state}`)}
        </span>
        <p className="mt-4 font-heading text-xl font-semibold text-foreground">{item.flashcard.prompt}</p>
        <MediaDisplay items={item.flashcard.media.filter((media) => media.side === "prompt")} />

        {item.flashcard.card_type === "basic" ? (
          <BasicCard
            revealed={revealed}
            answer={item.flashcard.answer}
            answerMedia={item.flashcard.media.filter((media) => media.side === "answer")}
            result={result}
            submitting={submitting}
            onReveal={() => setRevealed(true)}
            onRate={(rating) => submit({ rating })}
          />
        ) : null}

        {item.flashcard.card_type === "multiple_choice" ? (
          <MultipleChoiceCard
            options={item.flashcard.options}
            selectedOption={selectedOption}
            result={result}
            submitting={submitting}
            onSelect={(optionIndex) => {
              setSelectedOption(optionIndex);
              submit({ selected_option: optionIndex });
            }}
          />
        ) : null}

        {item.flashcard.card_type === "typed_answer" ? (
          <TypedAnswerCard
            value={typedAnswer}
            onChange={setTypedAnswer}
            answer={item.flashcard.answer}
            answerMedia={item.flashcard.media.filter((media) => media.side === "answer")}
            result={result}
            submitting={submitting}
            onSubmit={() => submit({ submitted_answer: typedAnswer.trim() })}
          />
        ) : null}
      </div>

      {result ? (
        <div className="flex justify-end">
          <Button type="button" onClick={goNext}>
            {index + 1 >= initialQueue.length ? t("finish") : t("nextCard")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ResultBanner({ result, t }: { result: ReviewResult; t: ReturnType<typeof useTranslations> }) {
  if (result.correct === null) return null;

  return (
    <div
      className={cn(
        "mt-4 flex items-center gap-2 rounded-lg p-3 text-sm font-medium",
        result.correct
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {result.correct ? (
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <XCircle className="size-4 shrink-0" aria-hidden="true" />
      )}
      {result.correct ? t("correct") : t("incorrect")}
    </div>
  );
}

function BasicCard({
  revealed,
  answer,
  answerMedia,
  result,
  submitting,
  onReveal,
  onRate,
}: {
  revealed: boolean;
  answer: string;
  answerMedia: FlashcardMediaItem[];
  result: ReviewResult | null;
  submitting: boolean;
  onReveal: () => void;
  onRate: (rating: ReviewRating) => void;
}) {
  const t = useTranslations("flashcards.study");

  if (!revealed) {
    return (
      <div className="mt-6">
        <Button type="button" variant="outline" onClick={onReveal}>
          {t("showAnswer")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-lg bg-surface-muted p-3">
        <p className="text-sm text-foreground">{answer}</p>
        <MediaDisplay items={answerMedia} />
      </div>
      {!result ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((rating) => (
            <Button
              key={rating.value}
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => onRate(rating.value)}
              className={RATING_STYLES[rating.value].className}
              style={RATING_STYLES[rating.value].style}
            >
              {t(`ratings.${rating.labelKey}`)}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-foreground-muted">{t("ratingRecorded")}</p>
      )}
    </div>
  );
}

function MultipleChoiceCard({
  options,
  selectedOption,
  result,
  submitting,
  onSelect,
}: {
  options: { text: string; is_correct: boolean }[];
  selectedOption: number | null;
  result: ReviewResult | null;
  submitting: boolean;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("flashcards.study");

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        {options.map((option, optionIndex) => {
          const isSelected = selectedOption === optionIndex;
          const showCorrectness = result !== null;
          return (
            <button
              key={optionIndex}
              type="button"
              disabled={submitting || result !== null}
              onClick={() => onSelect(optionIndex)}
              className={cn(
                "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                showCorrectness && option.is_correct && "border-success bg-success/10 text-success",
                showCorrectness && isSelected && !option.is_correct && "border-destructive bg-destructive/10 text-destructive",
                !showCorrectness && "border-border hover:border-primary/40 hover:bg-muted",
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>
      {result ? <ResultBanner result={result} t={t} /> : null}
    </div>
  );
}

function TypedAnswerCard({
  value,
  onChange,
  answer,
  answerMedia,
  result,
  submitting,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  answer: string;
  answerMedia: FlashcardMediaItem[];
  result: ReviewResult | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const t = useTranslations("flashcards.study");

  return (
    <div className="mt-6 space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!result && value.trim()) onSubmit();
        }}
        className="flex gap-2"
      >
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={submitting || result !== null}
          placeholder={t("typedAnswerPlaceholder")}
          autoFocus
        />
        {!result ? (
          <Button type="submit" disabled={submitting || !value.trim()}>
            {t("submitAnswer")}
          </Button>
        ) : null}
      </form>
      {result ? (
        <>
          <ResultBanner result={result} t={t} />
          {!result.correct ? (
            <p className="text-sm text-foreground-muted">{t("correctAnswerWas", { answer })}</p>
          ) : null}
          <MediaDisplay items={answerMedia} />
        </>
      ) : null}
    </div>
  );
}
