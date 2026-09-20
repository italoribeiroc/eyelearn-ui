"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, Clock, Loader2, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MediaDisplay } from "@/components/flashcards/media-display";
import { RichTextContent } from "@/components/flashcards/rich-text-content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/hooks/use-exam-clock";
import { Link, useRouter } from "@/i18n/navigation";
import { createExamRequest, ExamRequestError } from "@/lib/flashcards/exam-client";
import { cn } from "@/lib/utils";
import type { ExamResult, ExamResultQuestion } from "@/lib/api/types";

type Filter = "all" | "incorrect" | "unanswered";

function scoreTone(percent: number) {
  if (percent >= 80) return { text: "text-success", bar: "bg-success" };
  if (percent >= 50) return { text: "text-warning", bar: "bg-warning" };
  return { text: "text-destructive", bar: "bg-destructive" };
}

export function ExamResults({ result }: { result: ExamResult }) {
  const t = useTranslations("exam.results");
  const tErrors = useTranslations("exam.errors");
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [retaking, setRetaking] = useState(false);

  const { summary } = result;
  const tone = scoreTone(summary.score_percent);

  const incorrect = result.questions.filter((question) => question.answered && question.is_correct === false);
  const unanswered = result.questions.filter((question) => !question.answered);
  const shown =
    filter === "incorrect" ? incorrect : filter === "unanswered" ? unanswered : result.questions;

  // A retake can only reuse cards that still exist.
  const retakeable = [...incorrect, ...unanswered].filter((question) => !question.card_deleted).length;

  async function retake() {
    setRetaking(true);
    try {
      const exam = await createExamRequest({ mode: "retake", exam_id: result.id, time_limit_minutes: null });
      router.push(`/exam/${exam.id}`);
    } catch (caught) {
      const code = caught instanceof ExamRequestError ? caught.code : null;
      toast.error(tErrors(code === "too_many_in_progress" || code === "no_cards" ? code : "generic"));
      setRetaking(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="rounded-lg border border-border bg-surface p-5 text-center sm:p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm font-medium text-foreground-muted">{t("title")}</p>
        <p className={cn("mt-2 font-heading text-5xl font-bold sm:text-6xl tabular-nums", tone.text)}>
          {summary.score_percent}%
        </p>
        <p className="mt-1 text-sm text-foreground">
          {t("scoreLine", { correct: summary.correct, total: summary.total })}
        </p>
        <div className="mx-auto mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-muted">
          <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${summary.score_percent}%` }} />
        </div>
        {summary.time_taken_seconds !== null ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-foreground-muted">
            <Clock className="size-3.5" aria-hidden="true" />
            {result.time_limit_seconds !== null
              ? t("timeTakenOfLimit", {
                  time: formatClock(summary.time_taken_seconds),
                  limit: formatClock(result.time_limit_seconds),
                })
              : t("timeTaken", { time: formatClock(summary.time_taken_seconds) })}
          </p>
        ) : null}
      </div>

      {summary.timed_out ? (
        <Alert>
          <Clock className="size-4" aria-hidden="true" />
          <AlertDescription>
            {t("timedOut", {
              missing: summary.unanswered_when_time_ran_out,
              late: summary.answered_after_time.count,
              lateCorrect: summary.answered_after_time.correct,
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("statCorrect")} value={summary.correct} tone="success" />
        <StatTile label={t("statIncorrect")} value={summary.incorrect} tone="destructive" />
        <StatTile label={t("statUnanswered")} value={summary.unanswered} tone="muted" />
        {summary.timed_out ? (
          <StatTile label={t("statLate")} value={summary.answered_after_time.count} tone="warning" />
        ) : (
          <StatTile label={t("statTotal")} value={summary.total} tone="muted" />
        )}
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" size="lg" disabled={retakeable === 0 || retaking} onClick={retake}>
          {retaking ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-4" aria-hidden="true" />
          )}
          {t("retakeMissed", { count: retakeable })}
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/exam">{t("newExam")}</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/dashboard">{t("backToDashboard")}</Link>
        </Button>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">{t("reviewHeading")}</h2>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("filterLabel")}>
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              {t("filterAll", { count: result.questions.length })}
            </FilterChip>
            <FilterChip active={filter === "incorrect"} onClick={() => setFilter("incorrect")}>
              {t("filterIncorrect", { count: incorrect.length })}
            </FilterChip>
            <FilterChip active={filter === "unanswered"} onClick={() => setFilter("unanswered")}>
              {t("filterUnanswered", { count: unanswered.length })}
            </FilterChip>
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-foreground-muted">
            {t("nothingHere")}
          </p>
        ) : (
          <ol className="space-y-3">
            {shown.map((question) => (
              <ReviewItem key={question.id} question={question} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "destructive" | "warning" | "muted";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <dt className="text-xs font-medium text-foreground-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-heading text-2xl font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
          tone === "warning" && "text-warning",
          tone === "muted" && "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-brand-turquoise bg-brand-turquoise/10 text-brand-turquoise"
          : "border-border text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function ReviewItem({ question }: { question: ExamResultQuestion }) {
  const t = useTranslations("exam.results");
  const status = !question.answered ? "unanswered" : question.is_correct ? "correct" : "incorrect";

  return (
    <li
      className={cn(
        "rounded-lg border bg-surface p-4 break-words",
        status === "correct" && "border-success/30",
        status === "incorrect" && "border-destructive/30",
        status === "unanswered" && "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          {t("questionNumber", { number: question.position + 1 })}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {question.answered_after_time ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-foreground">
              <Clock className="size-3" aria-hidden="true" />
              {t("afterTime")}
            </span>
          ) : null}
          {question.card_deleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground-muted">
              <Trash2 className="size-3" aria-hidden="true" />
              {t("cardDeleted")}
            </span>
          ) : null}
          <StatusPill status={status} />
        </div>
      </div>

      <RichTextContent html={question.prompt} className="mt-2 font-heading text-base font-semibold text-foreground" />
      <MediaDisplay items={question.media.filter((media) => media.side === "prompt")} />

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-foreground-muted">{t("yourAnswer")}</dt>
          <dd className="text-foreground">{yourAnswerText(question, t)}</dd>
        </div>
        {status !== "correct" ? (
          <div>
            <dt className="text-xs font-medium text-foreground-muted">{t("correctAnswer")}</dt>
            <dd className="text-foreground">
              <CorrectAnswer question={question} />
            </dd>
          </div>
        ) : null}
      </dl>
    </li>
  );
}

function StatusPill({ status }: { status: "correct" | "incorrect" | "unanswered" }) {
  const t = useTranslations("exam.results");
  const Icon = status === "correct" ? CheckCircle2 : status === "incorrect" ? XCircle : CircleDashed;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        status === "correct" && "bg-success/10 text-success",
        status === "incorrect" && "bg-destructive/10 text-destructive",
        status === "unanswered" && "bg-muted text-foreground-muted",
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  );
}

function yourAnswerText(question: ExamResultQuestion, t: ReturnType<typeof useTranslations>): string {
  if (!question.answered) return t("noAnswer");
  if (question.card_type === "multiple_choice") {
    return question.selected_option !== null ? (question.options[question.selected_option]?.text ?? "") : "";
  }
  if (question.card_type === "typed_answer") return question.submitted_answer;
  return question.self_correct ? t("selfGotIt") : t("selfMissedIt");
}

function CorrectAnswer({ question }: { question: ExamResultQuestion }) {
  const t = useTranslations("exam.results");

  if (question.card_type === "multiple_choice") {
    return <>{question.options.filter((option) => option.is_correct).map((option) => option.text).join(" / ")}</>;
  }
  if (question.card_type === "typed_answer") {
    return (
      <>
        {question.answer}
        {question.accepted_answers.length > 0 ? (
          <span className="text-foreground-muted">
            {" "}
            {t("alsoAccepted", { answers: question.accepted_answers.join(", ") })}
          </span>
        ) : null}
      </>
    );
  }
  return (
    <>
      <RichTextContent html={question.answer} className="text-sm text-foreground" />
      <MediaDisplay items={question.media.filter((media) => media.side === "answer")} />
    </>
  );
}
