import { ArrowLeft, GraduationCap, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PlanUpgradeDialog } from "@/components/billing/plan-upgrade-dialog";
import { CollectionCard } from "@/components/flashcards/collection-card";
import { CollectionFormDialog } from "@/components/flashcards/collection-form-dialog";
import { CollectionLimitBanner } from "@/components/flashcards/collection-limit-banner";
import { FlashcardFormDialog } from "@/components/flashcards/flashcard-form-dialog";
import { FlashcardListItem } from "@/components/flashcards/flashcard-list-item";
import { ImportExportMenu } from "@/components/flashcards/import-export-menu";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { DjangoApiError } from "@/lib/api/django-client";
import { getSubscriptionStatus } from "@/lib/billing/subscription";
import { getCollection, listCollections, listFlashcards } from "@/lib/flashcards/api";

const FREE_COLLECTION_LIMIT = 3;

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = await params;
  const id = Number(collectionId);
  const [t, tBilling, tPlans] = await Promise.all([
    getTranslations("flashcards"),
    getTranslations("billing.summary"),
    getTranslations("account.plans"),
  ]);

  let collection;
  let subcollections;
  let flashcards;
  let allCollections;
  let subscription;
  try {
    [collection, subcollections, flashcards, allCollections, subscription] = await Promise.all([
      getCollection(id),
      listCollections(id),
      listFlashcards(id),
      listCollections(),
      getSubscriptionStatus(),
    ]);
  } catch (error) {
    if (error instanceof DjangoApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const isPro = subscription?.plan !== "free" && subscription?.plan != null;
  const atLimit = !isPro && allCollections.length >= FREE_COLLECTION_LIMIT;

  const backHref = collection.parent ? `/flashcards/${collection.parent}` : "/flashcards";

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={backHref}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("common.back")}
          </Link>
        </Button>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{collection.name}</h1>
            {collection.description ? (
              <p className="mt-1 text-sm text-foreground-muted">{collection.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <CollectionFormDialog
              mode="edit"
              collection={collection}
              trigger={<Button type="button" variant="outline" size="sm">{t("common.edit")}</Button>}
            />
            <Button asChild type="button" size="sm">
              <Link href={`/flashcards/${collection.id}/study`}>
                <GraduationCap className="size-4" aria-hidden="true" />
                {t("common.study")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-foreground">{t("subcollectionsTitle")}</h2>
          {atLimit ? (
            <PlanUpgradeDialog triggerLabel={tBilling("upsellCta")} title={tPlans("title")}>
              <PricingSection variant="embedded" />
            </PlanUpgradeDialog>
          ) : (
            <CollectionFormDialog
              mode="create"
              parentId={collection.id}
              trigger={
                <Button type="button" variant="outline" size="sm">
                  <Plus className="size-3.5" aria-hidden="true" />
                  {t("newSubcollection")}
                </Button>
              }
            />
          )}
        </div>
        {atLimit ? <CollectionLimitBanner /> : null}
        {subcollections.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("noSubcollections")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subcollections.map((sub) => (
              <CollectionCard key={sub.id} collection={sub} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-foreground">{t("flashcardsTitle")}</h2>
          <div className="flex flex-wrap gap-2">
            <ImportExportMenu collectionId={collection.id} />
            <FlashcardFormDialog
              mode="create"
              collectionId={collection.id}
              trigger={
                <Button type="button" size="sm">
                  <Plus className="size-3.5" aria-hidden="true" />
                  {t("newFlashcard")}
                </Button>
              }
            />
          </div>
        </div>
        <p className="text-xs text-foreground-muted">{t("importExport.hint")}</p>
        {flashcards.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("noFlashcards")}</p>
        ) : (
          <div className="space-y-2">
            {flashcards.map((flashcard) => (
              <FlashcardListItem key={flashcard.id} flashcard={flashcard} collectionId={collection.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
