import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscriptionStatus } from "@/lib/billing/subscription";
import { cn } from "@/lib/utils";
import { annualDiscountPercent, getPricingForLocale } from "./pricing";
import { PricingCard } from "./pricing-card";

/**
 * "marketing" is the full-bleed landing-page section (its own background,
 * border, and vertical padding, anchored at #pricing). "embedded" drops
 * that chrome so the same heading/copy/cards can be reused inside an
 * already-padded page (e.g. the account page) without doubling up padding.
 */
export async function PricingSection({
  variant = "marketing",
}: {
  variant?: "marketing" | "embedded";
} = {}) {
  const [t, locale, user] = await Promise.all([
    getTranslations("pricing"),
    getLocale(),
    getCurrentUser(),
  ]);
  // Only fetch subscription status for signed-in visitors -- skips a
  // wasted Django round-trip for anonymous marketing-page traffic.
  const subscription = user ? await getSubscriptionStatus() : null;

  const { currency, tiers } = getPricingForLocale(locale);
  const savePercent = annualDiscountPercent(tiers);

  const Wrapper = variant === "marketing" ? "section" : "div";

  return (
    <Wrapper
      {...(variant === "marketing" ? { id: "pricing" } : {})}
      className={cn(
        variant === "marketing" &&
          "scroll-mt-20 border-t border-border bg-surface-muted/50 py-16 sm:py-24",
      )}
    >
      <div className={cn(variant === "marketing" && "mx-auto max-w-6xl px-4 sm:px-6")}>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className={cn(
              "font-heading font-bold tracking-tight text-foreground",
              variant === "marketing" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
            )}
          >
            {t("title")}
          </h2>
          <p
            className={cn(
              "text-foreground-muted",
              variant === "marketing" ? "mt-4 text-lg" : "mt-2 text-base",
            )}
          >
            {variant === "marketing" ? t("subtitle") : t("subtitleEmbedded")}
          </p>
          {variant === "marketing" ? (
            <p className="mt-2 text-sm text-foreground-muted">
              <Link href="/terms#refund-policy" className="underline underline-offset-2 hover:text-foreground">
                {t("refundGuarantee")}
              </Link>
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "grid gap-4 sm:gap-6",
            variant === "marketing" ? "mt-14 lg:grid-cols-3" : "mt-8 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {tiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              currency={currency}
              locale={locale}
              annualDiscountPercent={savePercent}
              isAuthenticated={!!user}
              currentPlan={subscription?.plan ?? "free"}
            />
          ))}
        </div>
      </div>
    </Wrapper>
  );
}
