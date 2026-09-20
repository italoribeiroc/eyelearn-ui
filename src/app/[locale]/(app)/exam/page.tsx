import { getTranslations } from "next-intl/server";
import { ExamHistoryList } from "@/components/exam/exam-history-list";
import { ExamResumeBanner } from "@/components/exam/exam-resume-banner";
import { ExamSetup } from "@/components/exam/exam-setup";
import { listExams } from "@/lib/flashcards/exam-api";
import { listCollections } from "@/lib/flashcards/api";

export default async function ExamPage() {
  const [collections, exams, t] = await Promise.all([
    listCollections(),
    // History is a nice-to-have: a failure here must not block starting an exam.
    listExams({ limit: 20 }).catch(() => []),
    getTranslations("exam.setup"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("description")}</p>
      </div>

      <ExamResumeBanner exams={exams.filter((exam) => exam.status === "in_progress")} />
      <ExamSetup collections={collections} />
      <ExamHistoryList exams={exams.filter((exam) => exam.status === "completed")} />
    </div>
  );
}
