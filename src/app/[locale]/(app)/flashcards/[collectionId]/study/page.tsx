import { GraduationCap } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { StudySession } from "@/components/flashcards/study/study-session";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-turquoise/10">
          <GraduationCap className="size-7 text-brand-turquoise" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("caughtUpTitle")}</h1>
        <p className="max-w-sm text-sm text-foreground-muted">{t("caughtUpDescription")}</p>
        <Button asChild variant="outline">
          <Link href={`/flashcards/${id}`}>{t("backToCollection")}</Link>
        </Button>
      </div>
    );
  }

  return <StudySession collectionId={id} collectionName={collection.name} initialQueue={queue} />;
}
