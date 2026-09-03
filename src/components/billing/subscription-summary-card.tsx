import { CreditCard } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { PricingSection } from "@/components/marketing/pricing-section";
import type { SubscriptionStatus } from "@/lib/api/types";
import { BillingActionButton } from "./billing-action-button";
import { CancelRefundDialog } from "./cancel-refund-dialog";
import { PlanUpgradeDialog } from "./plan-upgrade-dialog";

export async function SubscriptionSummaryCard({
  subscription,
}: {
  subscription: SubscriptionStatus;
}) {
  const [t, tPricing, tPlans, locale] = await Promise.all([
    getTranslations("billing.summary"),
    getTranslations("pricing"),
    getTranslations("account.plans"),
    getLocale(),
  ]);

  const isFree = subscription.plan === "free";
  const planName = tPricing(`tiers.${subscription.plan}.name`);
  const periodDate = subscription.current_period_end
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(subscription.current_period_end),
      )
    : null;
  const refundEligible =
    subscription.refund_eligible_until !== null &&
    new Date(subscription.refund_eligible_until) > new Date();

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-turquoise/10">
          <CreditCard className="size-4.5 text-brand-turquoise" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-foreground-muted">{t("title")}</p>
          <p className="font-heading text-lg font-bold text-foreground">{planName}</p>
        </div>
      </div>

      {!isFree && periodDate ? (
        <p className="mt-3 text-sm text-foreground-muted">
          {subscription.cancel_at_period_end
            ? t("cancelingOn", { date: periodDate })
            : t("renewsOn", { date: periodDate })}
        </p>
      ) : null}

      {isFree ? <p className="mt-3 text-sm text-foreground-muted">{t("upsell")}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {isFree ? (
          <PlanUpgradeDialog triggerLabel={t("upsellCta")} title={tPlans("title")}>
            <PricingSection variant="embedded" />
          </PlanUpgradeDialog>
        ) : (
          <>
            <BillingActionButton mode="portal" variant="outline" size="sm">
              {t("manage")}
            </BillingActionButton>
            <BillingActionButton mode="portal" changePlan variant="outline" size="sm">
              {subscription.plan === "monthly" ? t("switchToAnnual") : t("switchToMonthly")}
            </BillingActionButton>
            {refundEligible ? (
              <CancelRefundDialog eligibleUntil={subscription.refund_eligible_until!} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
