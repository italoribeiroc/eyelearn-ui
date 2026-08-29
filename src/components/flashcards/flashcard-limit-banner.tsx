import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PlanUpgradeDialog } from "@/components/billing/plan-upgrade-dialog";
import { PricingSection } from "@/components/marketing/pricing-section";

/** Shown once a free-plan user hits FREE_FLASHCARD_LIMIT (see flashcards/services.py on the backend). */
export async function FlashcardLimitBanner() {
  const [t, tBilling, tPlans] = await Promise.all([
    getTranslations("flashcards.flashcardLimit"),
    getTranslations("billing.summary"),
    getTranslations("account.plans"),
  ]);

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-brand-accent/30 bg-brand-accent/10 p-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent/20">
          <Sparkles className="size-5 text-brand-accent" aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading text-base font-semibold text-foreground">{t("title")}</p>
          <p className="mt-1 text-sm text-foreground-muted">{t("description")}</p>
        </div>
      </div>
      <PlanUpgradeDialog triggerLabel={tBilling("upsellCta")} title={tPlans("title")}>
        <PricingSection variant="embedded" />
      </PlanUpgradeDialog>
    </div>
  );
}
