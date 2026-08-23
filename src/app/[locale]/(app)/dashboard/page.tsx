import { getTranslations } from "next-intl/server";
import { Flame, LayoutGrid, Target } from "lucide-react";
import { CheckoutRedirect } from "@/components/billing/checkout-redirect";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StartStudyingCta } from "@/components/dashboard/start-studying-cta";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/session";

const CHECKOUT_PLANS = ["monthly", "annual"] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; startCheckout?: string }>;
}) {
  const [user, t, { checkout, startCheckout }] = await Promise.all([
    getCurrentUser(),
    getTranslations("dashboard"),
    searchParams,
  ]);

  // The (app) layout already redirects unauthenticated visitors to /login,
  // so `user` is guaranteed here -- this is just a type-narrowing guard.
  // `subscription` can still be null on a transient Django error, in which
  // case the summary card below is simply omitted rather than the page.
  if (!user) return null;

  // Post-auth handoff from a pricing card CTA -- see CLAUDE.md. Bounces
  // straight to Stripe instead of rendering the dashboard.
  if (CHECKOUT_PLANS.includes(startCheckout as (typeof CHECKOUT_PLANS)[number])) {
    return <CheckoutRedirect plan={startCheckout as (typeof CHECKOUT_PLANS)[number]} />;
  }

  return (
    <div className="space-y-8">
      <WelcomeHeader username={user.username} />

      {checkout === "success" ? (
        <Alert>
          <AlertDescription>{t("checkoutSuccess")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Flame}
          label={t("stats.streak")}
          comingSoon
          comingSoonLabel={t("comingSoon")}
        />
        <StatCard
          icon={Target}
          label={t("stats.dailyGoal")}
          comingSoon
          comingSoonLabel={t("comingSoon")}
        />
        <StatCard
          icon={LayoutGrid}
          label={t("stats.cardsStudied")}
          comingSoon
          comingSoonLabel={t("comingSoon")}
        />
      </div>

      <StartStudyingCta />
    </div>
  );
}
