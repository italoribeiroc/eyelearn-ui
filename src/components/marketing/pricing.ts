/**
 * Illustrative MVP pricing -- the Django backend has no billing endpoints yet.
 * Structured as a plain config array so prices/features can be swapped for
 * real billing data later without touching the section/card components.
 *
 * Priced per locale rather than converted at render time: BRL pricing for
 * the Brazilian market is set independently (round numbers, its own
 * discount), not a currency conversion of the USD price.
 *
 * Three cards shown side by side (no billing-period toggle): Free, Monthly,
 * and Annual -- Monthly and Annual are the same plan/features, just
 * different billing cadence, each with its own always-visible price.
 */
export type PricingTier = {
  id: "free" | "monthly" | "annual";
  /** Price for this specific card: 0 for free, per-month for monthly, per-year for annual. */
  price: number;
  featureCount: number;
  highlighted?: boolean;
};

export type LocalePricing = {
  currency: "USD" | "BRL";
  tiers: PricingTier[];
};

const PRICING_BY_LOCALE: Record<string, LocalePricing> = {
  en: {
    currency: "USD",
    tiers: [
      { id: "free", price: 0, featureCount: 4 },
      { id: "monthly", price: 5, featureCount: 5 },
      { id: "annual", price: 50, featureCount: 5, highlighted: true },
    ],
  },
  "pt-BR": {
    currency: "BRL",
    tiers: [
      { id: "free", price: 0, featureCount: 4 },
      { id: "monthly", price: 15, featureCount: 5 },
      { id: "annual", price: 150, featureCount: 5, highlighted: true },
    ],
  },
};

export function getPricingForLocale(locale: string): LocalePricing {
  return PRICING_BY_LOCALE[locale] ?? PRICING_BY_LOCALE.en;
}

/** Whole-number amounts render without decimals (e.g. "$9", "R$100"). */
export function formatPrice(amount: number, currency: "USD" | "BRL", locale: string) {
  const rounded = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/** Percentage saved by the annual card vs. twelve payments at the monthly card's price. */
export function annualDiscountPercent(tiers: PricingTier[]): number {
  const monthly = tiers.find((tier) => tier.id === "monthly");
  const annual = tiers.find((tier) => tier.id === "annual");
  if (!monthly || !annual || monthly.price <= 0) return 0;
  return Math.round((1 - annual.price / (monthly.price * 12)) * 100);
}
