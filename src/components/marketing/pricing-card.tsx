import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PricingTier } from "./pricing";

export function PricingCard({ tier }: { tier: PricingTier }) {
  const t = useTranslations("pricing");
  const features = Array.from({ length: tier.featureCount }, (_, i) => i);

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

      <p className="mt-6 flex items-baseline gap-1">
        <span className="font-heading text-4xl font-extrabold text-foreground">
          {tier.monthlyPrice === 0 ? t("free") : `$${tier.monthlyPrice}`}
        </span>
        {tier.monthlyPrice > 0 ? (
          <span className="text-sm text-foreground-muted">{t("perMonth")}</span>
        ) : null}
      </p>

      <ul className="mt-6 flex-1 space-y-3">
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
