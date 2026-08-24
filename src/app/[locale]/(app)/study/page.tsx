import { getTranslations } from "next-intl/server";
import { CaughtUpState } from "@/components/flashcards/study/caught-up-state";
import { StudySession } from "@/components/flashcards/study/study-session";
import { getDailyStudyQueue } from "@/lib/flashcards/goals-api";

export default async function DailyStudyPage() {
  const [queue, t] = await Promise.all([getDailyStudyQueue(), getTranslations("flashcards.study")]);

  if (queue.length === 0) {
    return (
      <CaughtUpState
        title={t("caughtUpTitle")}
        description={t("dailyCaughtUpDescription")}
        backHref="/dashboard"
        backLabel={t("backToDashboard")}
      />
    );
  }

  return (
    <StudySession
      title={t("dailyStudyTitle")}
      backHref="/dashboard"
      backLabel={t("backToDashboard")}
      initialQueue={queue}
    />
  );
}
