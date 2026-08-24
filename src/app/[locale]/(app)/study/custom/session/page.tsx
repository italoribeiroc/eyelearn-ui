import { getTranslations } from "next-intl/server";
import { CaughtUpState } from "@/components/flashcards/study/caught-up-state";
import { StudySession } from "@/components/flashcards/study/study-session";
import { getCustomStudyQueue } from "@/lib/flashcards/goals-api";

export default async function CustomStudySessionPage({
  searchParams,
}: {
  searchParams: Promise<{ collections?: string }>;
}) {
  const { collections } = await searchParams;
  const collectionIds = (collections ?? "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  const t = await getTranslations("flashcards.study");

  const queue = collectionIds.length > 0 ? await getCustomStudyQueue(collectionIds) : [];

  if (queue.length === 0) {
    return (
      <CaughtUpState
        title={t("caughtUpTitle")}
        description={t("customCaughtUpDescription")}
        backHref="/study/custom"
        backLabel={t("backToPicker")}
      />
    );
  }

  return (
    <StudySession
      title={t("customStudyTitle")}
      backHref="/study/custom"
      backLabel={t("backToPicker")}
      initialQueue={queue}
    />
  );
}
