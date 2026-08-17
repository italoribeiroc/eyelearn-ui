import { getLocale, getTranslations } from "next-intl/server";
import { annualDiscountPercent, getPricingForLocale } from "./pricing";
import { PricingCard } from "./pricing-card";

export async function PricingSection() {
  const t = await getTranslations("pricing");
  const locale = await getLocale();

  const { currency, tiers } = getPricingForLocale(locale);
  const savePercent = annualDiscountPercent(tiers);

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border bg-surface-muted/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              currency={currency}
              locale={locale}
              annualDiscountPercent={savePercent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
