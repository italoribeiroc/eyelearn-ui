"use client";

import { ChevronRight, Clock, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DeleteConfirmDialog } from "@/components/flashcards/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/hooks/use-exam-clock";
import { Link } from "@/i18n/navigation";
import { deleteExamRequest } from "@/lib/flashcards/exam-client";
import { cn } from "@/lib/utils";
import type { ExamListItem } from "@/lib/api/types";

/** Finished exams, newest first: score at a glance, click through for the full review. */
export function ExamHistoryList({ exams }: { exams: ExamListItem[] }) {
  const t = useTranslations("exam.history");
  const format = useFormatter();

  if (exams.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">{t("heading")}</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {exams.map((exam) => {
          const summary = exam.summary;
          if (!summary) return null;
          return (
            <li key={exam.id} className="flex items-center gap-1 pr-2 hover:bg-surface-muted">
              <Link href={`/exam/${exam.id}`} className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3">
                <span
                  className={cn(
                    "w-14 shrink-0 text-right font-heading text-xl font-bold tabular-nums",
                    summary.score_percent >= 80 && "text-success",
                    summary.score_percent >= 50 && summary.score_percent < 80 && "text-warning",
                    summary.score_percent < 50 && "text-destructive",
                  )}
                >
                  {summary.score_percent}%
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {exam.source_labels.join(", ") || t("untitled")}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 text-xs text-foreground-muted">
                    <span>{t("correctOf", { correct: summary.correct, total: summary.total })}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {format.dateTime(new Date(exam.started_at), { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    {summary.time_taken_seconds !== null ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatClock(summary.time_taken_seconds)}</span>
                      </>
                    ) : null}
                    {summary.timed_out ? (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <Clock className="size-3" aria-hidden="true" />
                        {t("timedOut")}
                      </span>
                    ) : null}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
              </Link>
              <DeleteConfirmDialog
                trigger={
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={t("delete")}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                }
                title={t("deleteTitle")}
                description={t("deleteDescription")}
                onConfirm={() => deleteExamRequest(exam.id)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
