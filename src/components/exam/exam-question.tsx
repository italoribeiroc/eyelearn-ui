"use client";

import { Check, CircleAlert, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { MediaDisplay } from "@/components/flashcards/media-display";
import { RichTextContent } from "@/components/flashcards/rich-text-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ExamPlayerQuestion } from "@/lib/api/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

/** What the user has answered so far, as tracked locally (and saved in the background). */
export type LocalAnswer = {
  selected_option: number | null;
  self_correct: boolean | null;
  answered: boolean;
  saveState: SaveState;
};

/**
 * One exam question. Unlike a study card it never says whether an answer is
 * right: choosing, typing, or self-grading only records the answer, and the
 * verdict comes with the results at the end.
 */
export function ExamQuestionView({
  question,
  answer,
  draft,
  revealed,
  onDraftChange,
  onCommitDraft,
  onReveal,
  onSelectOption,
  onSelfGrade,
  onRetry,
}: {
  question: ExamPlayerQuestion;
  answer: LocalAnswer;
  draft: string;
  revealed: boolean;
  onDraftChange: (value: string) => void;
  onCommitDraft: () => void;
  onReveal: () => void;
  onSelectOption: (index: number) => void;
  onSelfGrade: (correct: boolean) => void;
  onRetry: () => void;
}) {
  const t = useTranslations("exam.session");
  const promptMedia = question.media.filter((media) => media.side === "prompt");
  const answerMedia = question.media.filter((media) => media.side === "answer");

  return (
    <div>
      <RichTextContent html={question.prompt} className="font-heading text-xl font-semibold text-foreground" />
      <MediaDisplay items={promptMedia} />

      {question.card_type === "multiple_choice" ? (
        <div className="mt-6 space-y-2" role="radiogroup" aria-label={t("optionsLabel")}>
          {question.options.map((text, optionIndex) => {
            const selected = answer.selected_option === optionIndex;
            return (
              <button
                key={optionIndex}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelectOption(optionIndex)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                  selected
                    ? "border-brand-turquoise bg-brand-turquoise/10 text-foreground"
                    : "border-border hover:border-primary/40 hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-brand-turquoise bg-brand-turquoise text-white" : "border-input",
                  )}
                  aria-hidden="true"
                >
                  {selected ? <Check className="size-3" /> : null}
                </span>
                {text}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.card_type === "typed_answer" ? (
        <form
          className="mt-6 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onCommitDraft();
          }}
        >
          <Input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onBlur={onCommitDraft}
            placeholder={t("typedPlaceholder")}
            aria-label={t("typedPlaceholder")}
            maxLength={1000}
            autoComplete="off"
          />
          <Button type="submit" variant="outline" disabled={!draft.trim()}>
            {t("saveAnswer")}
          </Button>
        </form>
      ) : null}

      {question.card_type === "basic" ? (
        revealed || answer.answered ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-surface-muted p-3">
              <RichTextContent html={question.answer ?? ""} className="text-sm text-foreground" />
              <MediaDisplay items={answerMedia} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t("selfGradePrompt")}</p>
              <div className="grid grid-cols-2 gap-2">
                <GradeButton
                  active={answer.self_correct === true}
                  tone="success"
                  onClick={() => onSelfGrade(true)}
                >
                  <ThumbsUp className="size-4" aria-hidden="true" />
                  {t("gotIt")}
                </GradeButton>
                <GradeButton
                  active={answer.self_correct === false}
                  tone="destructive"
                  onClick={() => onSelfGrade(false)}
                >
                  <ThumbsDown className="size-4" aria-hidden="true" />
                  {t("missedIt")}
                </GradeButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <Button type="button" variant="outline" onClick={onReveal}>
              {t("showAnswer")}
            </Button>
          </div>
        )
      ) : null}

      <SaveIndicator answer={answer} onRetry={onRetry} />
    </div>
  );
}

function GradeButton({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "success" | "destructive";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors",
        active && tone === "success" && "border-success bg-success/10 text-success",
        active && tone === "destructive" && "border-destructive bg-destructive/10 text-destructive",
        !active && "border-border text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function SaveIndicator({ answer, onRetry }: { answer: LocalAnswer; onRetry: () => void }) {
  const t = useTranslations("exam.session");

  if (answer.saveState === "error") {
    return (
      <p className="mt-4 flex items-center gap-2 text-xs text-destructive" role="alert">
        <CircleAlert className="size-3.5" aria-hidden="true" />
        {t("saveFailed")}
        <button type="button" onClick={onRetry} className="font-semibold underline">
          {t("retry")}
        </button>
      </p>
    );
  }
  if (answer.saveState === "saving") {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        {t("saving")}
      </p>
    );
  }
  if (answer.answered) {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Check className="size-3.5 text-success" aria-hidden="true" />
        {t("saved")}
      </p>
    );
  }
  return <p className="mt-4 text-xs text-foreground-muted">{t("notAnsweredYet")}</p>;
}
