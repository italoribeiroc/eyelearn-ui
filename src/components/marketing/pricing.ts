/**
 * Illustrative MVP pricing -- the Django backend has no billing endpoints yet.
 * Structured as a plain config array so prices/features can be swapped for
 * real billing data later without touching the section/card components.
 */
export type PricingTier = {
  id: "free" | "pro" | "premium";
  monthlyPrice: number;
  featureCount: number;
  highlighted?: boolean;
};

export const PRICING_TIERS: PricingTier[] = [
  { id: "free", monthlyPrice: 0, featureCount: 4 },
  { id: "pro", monthlyPrice: 9, featureCount: 5, highlighted: true },
  { id: "premium", monthlyPrice: 19, featureCount: 6 },
];
