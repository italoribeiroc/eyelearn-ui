import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CaughtUpState } from "@/components/flashcards/study/caught-up-state";
import { StudySession } from "@/components/flashcards/study/study-session";
import { DjangoApiError } from "@/lib/api/django-client";
import { getCollection, getStudyQueue } from "@/lib/flashcards/api";

export default async function CollectionStudyPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = await params;
  const id = Number(collectionId);
  const t = await getTranslations("flashcards.study");

  let collection;
  let queue;
  try {
    [collection, queue] = await Promise.all([getCollection(id), getStudyQueue(id)]);
  } catch (error) {
    if (error instanceof DjangoApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (queue.length === 0) {
    return (
      <CaughtUpState
        title={t("caughtUpTitle")}
        description={t("caughtUpDescription")}
        backHref={`/flashcards/${id}`}
        backLabel={t("backToCollection")}
      />
    );
  }

  return (
    <StudySession
      title={collection.name}
      backHref={`/flashcards/${id}`}
      backLabel={t("backToCollection")}
      initialQueue={queue}
    />
  );
}
