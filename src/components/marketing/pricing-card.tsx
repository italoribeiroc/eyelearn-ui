import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { formatPrice, type PricingTier } from "./pricing";

export function PricingCard({
  tier,
  currency,
  locale,
  annualDiscountPercent,
}: {
  tier: PricingTier;
  currency: "USD" | "BRL";
  locale: string;
  /** Only used by the "annual" card, to show what it saves vs. paying monthly. */
  annualDiscountPercent: number;
}) {
  const t = useTranslations("pricing");
  const features = Array.from({ length: tier.featureCount }, (_, i) => i);
  const isFree = tier.id === "free";
  const isAnnual = tier.id === "annual";

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-surface p-6",
        tier.highlighted
          ? "border-brand-turquoise shadow-[var(--shadow-soft-lg)] ring-1 ring-brand-turquoise"
          : "border-border shadow-[var(--shadow-soft)]",
      )}
    >
      {tier.highlighted ? (
        <span className="mb-3 inline-flex w-fit items-center rounded-full bg-brand-turquoise px-3 py-1 text-xs font-semibold text-brand-turquoise-foreground">
          {t("mostPopular")}
        </span>
      ) : null}

      <h3 className="font-heading text-xl font-bold text-foreground">
        {t(`tiers.${tier.id}.name`)}
      </h3>
      <p className="mt-1 text-sm text-foreground-muted">
        {t(`tiers.${tier.id}.tagline`)}
      </p>

      <div className="mt-6">
        <p className="flex items-baseline gap-1">
          <span className="font-heading text-4xl font-extrabold text-foreground">
            {isFree ? t("free") : formatPrice(tier.price, currency, locale)}
          </span>
          {!isFree ? (
            <span className="text-sm text-foreground-muted">
              {isAnnual ? t("perYear") : t("perMonth")}
            </span>
          ) : null}
        </p>

        {isAnnual ? (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-foreground-muted">
            {t("equivalentPerMonth", {
              price: formatPrice(tier.price / 12, currency, locale),
            })}
            {annualDiscountPercent > 0 ? (
              <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 font-semibold text-brand-accent">
                {t("save", { percent: annualDiscountPercent })}
              </span>
            ) : null}
          </p>
        ) : (
          <span className="mt-1.5 block h-4" aria-hidden="true" />
        )}
      </div>

      <ul className="mt-4 flex-1 space-y-3">
        {features.map((index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm text-foreground-muted">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-turquoise" aria-hidden="true" />
            <span>{t(`tiers.${tier.id}.features.${index}`)}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        size="lg"
        variant={tier.highlighted ? "default" : "outline"}
        className="mt-8"
      >
        <Link href="/register">{t(`tiers.${tier.id}.cta`)}</Link>
      </Button>
    </div>
  );
}
