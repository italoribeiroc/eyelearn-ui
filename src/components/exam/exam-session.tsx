"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExamNavigator } from "@/components/exam/exam-navigator";
import { ExamQuestionView, type LocalAnswer } from "@/components/exam/exam-question";
import { ExamResults } from "@/components/exam/exam-results";
import { ExamTimeUpDialog } from "@/components/exam/exam-time-up-dialog";
import { ExamTimer } from "@/components/exam/exam-timer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useExamClock } from "@/hooks/use-exam-clock";
import { useExamContinued } from "@/hooks/use-exam-continued";
import { Link, useRouter } from "@/i18n/navigation";
import {
  answerExamRequest,
  ExamRequestError,
  examStatusRequest,
  finishExamRequest,
} from "@/lib/flashcards/exam-client";
import type { ExamAnswerPayload, ExamInProgress, ExamResult } from "@/lib/api/types";

const SAVE_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isSessionExpired(error: unknown) {
  return error instanceof ExamRequestError && error.status === 401;
}

function initialAnswers(exam: ExamInProgress): Record<number, LocalAnswer> {
  return Object.fromEntries(
    exam.questions.map((question) => [
      question.id,
      {
        selected_option: question.selected_option,
        self_correct: question.self_correct,
        answered: question.answered,
        saveState: "idle" as const,
      },
    ]),
  );
}

export function ExamSession({ exam }: { exam: ExamInProgress }) {
  const t = useTranslations("exam.session");
  const router = useRouter();
  const locale = useLocale();

  const [index, setIndex] = useState(() => {
    const firstOpen = exam.questions.findIndex((question) => !question.answered);
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const [answers, setAnswers] = useState(() => initialAnswers(exam));
  const [drafts, setDrafts] = useState<Record<number, string>>(() =>
    Object.fromEntries(exam.questions.map((question) => [question.id, question.submitted_answer])),
  );
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [timeUpChecked, setTimeUpChecked] = useState(false);

  const [continued, markContinued] = useExamContinued(exam.id);
  const clock = useExamClock({
    endsAt: exam.ends_at,
    startedAt: exam.started_at,
    serverNow: exam.server_now,
    continued,
  });

  // Saves are chained so answers reach the server in the order they were
  // given, and finishing can wait for the whole backlog. Each link swallows
  // its own errors (surfaced per-question), so the chain never rejects.
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const saveVersion = useRef<Record<number, number>>({});
  const lastPayload = useRef<Record<number, ExamAnswerPayload>>({});
  const savedText = useRef<Record<number, string>>(
    Object.fromEntries(exam.questions.map((question) => [question.id, question.submitted_answer.trim()])),
  );

  const question = exam.questions[index];
  const answeredCount = exam.questions.filter((item) => answers[item.id].answered).length;
  const unansweredCount = exam.questions.length - answeredCount;

  function patchAnswer(questionId: number, patch: Partial<LocalAnswer>) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));
  }

  function save(questionId: number, payload: ExamAnswerPayload, local: Partial<LocalAnswer>) {
    const version = (saveVersion.current[questionId] ?? 0) + 1;
    saveVersion.current[questionId] = version;
    lastPayload.current[questionId] = payload;
    patchAnswer(questionId, { ...local, answered: true, saveState: "saving" });

    const run = async () => {
      for (let attempt = 0; attempt < SAVE_ATTEMPTS; attempt += 1) {
        try {
          const response = await answerExamRequest(exam.id, payload);
          clock.sync(response.server_now);
          if (saveVersion.current[questionId] === version) patchAnswer(questionId, { saveState: "saved" });
          return;
        } catch (caught) {
          const error = caught instanceof ExamRequestError ? caught : null;
          if (error?.code === "exam_completed") {
            // Finished elsewhere (another tab, or the time-up flow): show the results.
            router.refresh();
            return;
          }
          if (isSessionExpired(caught)) {
            // Answers already saved stay saved; logging back in resumes the exam.
            patchAnswer(questionId, { saveState: "error" });
            toast.error(t("sessionExpired"));
            router.replace("/login");
            return;
          }
          const retryable = !error || error.status === 0 || error.status >= 500 || error.status === 429;
          if (!retryable) break;
          await sleep(600 * 2 ** attempt);
        }
      }
      if (saveVersion.current[questionId] === version) {
        patchAnswer(questionId, { saveState: "error" });
        toast.error(t("saveFailedToast"));
      }
    };
    saveChain.current = saveChain.current.then(run);
  }

  function commitDraft(target = question) {
    if (target.card_type !== "typed_answer") return;
    const text = (drafts[target.id] ?? "").trim();
    if (!text || savedText.current[target.id] === text) return;
    savedText.current[target.id] = text;
    save(target.id, { question_id: target.id, submitted_answer: text }, {});
  }

  function go(next: number) {
    commitDraft();
    setIndex(Math.min(Math.max(next, 0), exam.questions.length - 1));
  }

  function openConfirm() {
    commitDraft();
    setConfirmOpen(true);
  }

  function retry(target = question) {
    const payload = lastPayload.current[target.id];
    if (!payload) return;
    save(target.id, payload, {});
  }

  async function finish() {
    commitDraft();
    setFinishing(true);
    try {
      await saveChain.current;
      setResult(await finishExamRequest(exam.id));
    } catch (caught) {
      if (caught instanceof ExamRequestError && caught.status === 404) {
        router.replace("/exam");
      } else if (isSessionExpired(caught)) {
        toast.error(t("sessionExpired"));
        router.replace("/login");
      } else {
        toast.error(t("finishFailed"));
      }
    } finally {
      setFinishing(false);
      setConfirmOpen(false);
    }
  }

  // At zero, ask the server before believing our own clock: it may have been
  // finished elsewhere, or the local clock may simply be ahead of the server's.
  const checkingExpiry = useRef(false);
  useEffect(() => {
    if (clock.phase !== "expired" || timeUpChecked || checkingExpiry.current) return;
    checkingExpiry.current = true;
    examStatusRequest(exam.id)
      .then((status) => {
        clock.sync(status.server_now);
        if (status.status === "completed") router.refresh();
        else setTimeUpChecked(true);
      })
      .catch(() => setTimeUpChecked(true))
      .finally(() => {
        checkingExpiry.current = false;
      });
  }, [clock, exam.id, router, timeUpChecked]);

  // Announced to screen readers only at milestones, never every second.
  const announcement = useMemo(() => {
    if (clock.phase === "expired") return t("announceTimeUp");
    if (clock.phase === "running" && clock.remainingSeconds <= 60) return t("announceOneMinute");
    return "";
  }, [clock.phase, clock.remainingSeconds, t]);

  const navigatorItems = exam.questions.map((item) => ({
    answered: answers[item.id].answered,
    failed: answers[item.id].saveState === "error",
  }));

  if (result) return <ExamResults result={result} />;

  const progressPercent = (answeredCount / exam.questions.length) * 100;
  const startedLabel = new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(exam.started_at));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold text-foreground">{t("title")}</h1>
            <p className="truncate text-sm text-foreground-muted">
              {exam.source_labels.length > 0 ? `${exam.source_labels.join(", ")} · ` : ""}
              {t("startedAt", { time: startedLabel })}
            </p>
          </div>
          <ExamTimer
            phase={clock.phase}
            remainingSeconds={clock.remainingSeconds}
            overtimeSeconds={clock.overtimeSeconds}
            elapsedSeconds={clock.elapsedSeconds}
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{t("progressLabel")}</span>
            <span className="text-foreground-muted">
              {t("answeredOf", { answered: answeredCount, total: exam.questions.length })}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-turquoise to-brand-mint transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-soft)] break-words sm:p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          {t("questionOf", { number: index + 1, total: exam.questions.length })}
        </p>
        <ExamQuestionView
          // Fresh state per question (typed input focus, reveal state).
          key={question.id}
          question={question}
          answer={answers[question.id]}
          draft={drafts[question.id] ?? ""}
          revealed={revealed.has(question.id)}
          onDraftChange={(value) => setDrafts((prev) => ({ ...prev, [question.id]: value }))}
          onCommitDraft={() => commitDraft()}
          onReveal={() => setRevealed((prev) => new Set(prev).add(question.id))}
          onSelectOption={(optionIndex) =>
            save(
              question.id,
              { question_id: question.id, selected_option: optionIndex },
              { selected_option: optionIndex },
            )
          }
          onSelfGrade={(correct) =>
            save(question.id, { question_id: question.id, self_correct: correct }, { self_correct: correct })
          }
          onRetry={() => retry()}
        />
      </div>

      <ExamNavigator items={navigatorItems} current={index} onGo={go} />

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" className="w-full sm:w-auto">
          <Link href="/exam">{t("leave")}</Link>
        </Button>
        <Button type="button" size="lg" onClick={openConfirm} className="w-full sm:w-auto">
          {t("finishExam")}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !finishing && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">{t("confirmTitle")}</DialogTitle>
            <DialogDescription>
              {unansweredCount > 0
                ? t("confirmUnanswered", { count: unansweredCount })
                : t("confirmAllAnswered")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-col-reverse sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              disabled={finishing}
              onClick={() => setConfirmOpen(false)}
              className="h-auto min-h-11 w-full py-2 whitespace-normal"
            >
              {t("keepWorking")}
            </Button>
            <Button
              type="button"
              disabled={finishing}
              onClick={finish}
              className="h-auto min-h-11 w-full py-2 whitespace-normal"
            >
              {finishing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {t("finishNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExamTimeUpDialog
        open={clock.phase === "expired" && timeUpChecked && !result}
        answered={answeredCount}
        total={exam.questions.length}
        finishing={finishing}
        onFinish={finish}
        onKeepGoing={markContinued}
      />
    </div>
  );
}
