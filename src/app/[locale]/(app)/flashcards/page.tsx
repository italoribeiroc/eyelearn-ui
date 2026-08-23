import { Layers, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CollectionCard } from "@/components/flashcards/collection-card";
import { CollectionFormDialog } from "@/components/flashcards/collection-form-dialog";
import { CollectionLimitBanner } from "@/components/flashcards/collection-limit-banner";
import { PlanUpgradeDialog } from "@/components/billing/plan-upgrade-dialog";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Button } from "@/components/ui/button";
import { getSubscriptionStatus } from "@/lib/billing/subscription";
import { listCollections } from "@/lib/flashcards/api";

const FREE_COLLECTION_LIMIT = 3;

export default async function FlashcardsPage() {
  const [t, tBilling, tPlans, allCollections, subscription] = await Promise.all([
    getTranslations("flashcards"),
    getTranslations("billing.summary"),
    getTranslations("account.plans"),
    listCollections(),
    getSubscriptionStatus(),
  ]);

  const rootCollections = allCollections.filter((collection) => collection.parent === null);
  const isPro = subscription?.plan !== "free" && subscription?.plan != null;
  const atLimit = !isPro && allCollections.length >= FREE_COLLECTION_LIMIT;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t("subtitle")}</p>
        </div>
        {atLimit ? (
          <PlanUpgradeDialog triggerLabel={tBilling("upsellCta")} title={tPlans("title")}>
            <PricingSection variant="embedded" />
          </PlanUpgradeDialog>
        ) : (
          <CollectionFormDialog
            mode="create"
            trigger={
              <Button type="button">
                <Plus className="size-4" aria-hidden="true" />
                {t("newCollection")}
              </Button>
            }
          />
        )}
      </div>

      {atLimit ? <CollectionLimitBanner /> : null}

      {rootCollections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-turquoise/10">
            <Layers className="size-6 text-brand-turquoise" aria-hidden="true" />
          </span>
          <h2 className="font-heading text-lg font-bold text-foreground">{t("emptyTitle")}</h2>
          <p className="max-w-sm text-sm text-foreground-muted">{t("emptyDescription")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rootCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
