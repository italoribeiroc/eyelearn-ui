"use client";

import { Play, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DeleteConfirmDialog } from "@/components/flashcards/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { deleteExamRequest } from "@/lib/flashcards/exam-client";
import type { ExamListItem } from "@/lib/api/types";

/** Exams that were started but not finished, so a refresh or a closed tab never loses one. */
export function ExamResumeBanner({ exams }: { exams: ExamListItem[] }) {
  const t = useTranslations("exam.resume");
  const format = useFormatter();

  if (exams.length === 0) return null;

  return (
    <section
      aria-labelledby="exam-resume-heading"
      className="space-y-3 rounded-lg border border-brand-turquoise/30 bg-brand-turquoise/5 p-4"
    >
      <h2 id="exam-resume-heading" className="font-heading text-base font-semibold text-foreground">
        {t("heading", { count: exams.length })}
      </h2>
      <ul className="space-y-2">
        {exams.map((exam) => (
          <li
            key={exam.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {exam.source_labels.join(", ") || t("untitled")}
              </p>
              <p className="text-xs text-foreground-muted">
                {t("progress", { answered: exam.answered_count, total: exam.total })}
                {" · "}
                {format.dateTime(new Date(exam.started_at), { dateStyle: "medium", timeStyle: "short" })}
                {exam.time_limit_seconds !== null
                  ? ` · ${t("timed", { minutes: Math.round(exam.time_limit_seconds / 60) })}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <DeleteConfirmDialog
                trigger={
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={t("discard")}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                }
                title={t("discardTitle")}
                description={t("discardDescription")}
                onConfirm={() => deleteExamRequest(exam.id)}
              />
              <Button asChild size="sm">
                <Link href={`/exam/${exam.id}`}>
                  <Play className="size-3.5" aria-hidden="true" />
                  {t("resume")}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
