import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AiDraftReview } from "@/components/flashcards/ai-draft-review";
import { DjangoApiError } from "@/lib/api/django-client";
import { getAiGenerationDraft } from "@/lib/flashcards/api";

export default async function AiGenerationReviewPage({
  params,
}: {
  params: Promise<{ collectionId: string; draftId: string }>;
}) {
  const { collectionId, draftId } = await params;
  const t = await getTranslations("flashcards.aiGenerate");

  let draft;
  try {
    draft = await getAiGenerationDraft(Number(draftId));
  } catch (error) {
    if (error instanceof DjangoApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // A draft belongs to exactly one collection; guard against a stale/mismatched URL.
  if (draft.collection !== Number(collectionId)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("reviewTitle")}</h1>
        <p className="mt-1.5 text-sm text-foreground-muted">{t("reviewSubtitle")}</p>
      </div>
      <AiDraftReview collectionId={Number(collectionId)} initialDraft={draft} />
    </div>
  );
}
