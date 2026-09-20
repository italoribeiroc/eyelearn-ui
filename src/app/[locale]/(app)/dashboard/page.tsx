import { getTranslations } from "next-intl/server";
import { ArrowRight, LayoutGrid, Target } from "lucide-react";
import { CheckoutRedirect } from "@/components/billing/checkout-redirect";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { GoalIntroDialog } from "@/components/dashboard/goal-intro-dialog";
import { OnboardingGuideDialog } from "@/components/onboarding/onboarding-guide-dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { StreakWidget } from "@/components/dashboard/streak-widget";
import { StudyModesSection } from "@/components/dashboard/study-modes-section";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addDaysUTC, isoDate, mostRecentMondayUTC } from "@/lib/flashcards/date-utils";
import { listCollections } from "@/lib/flashcards/api";
import { listExams } from "@/lib/flashcards/exam-api";
import { getGoalsSummary, getStreakCalendar } from "@/lib/flashcards/goals-api";
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

  const monday = mostRecentMondayUTC();
  const [summary, week, collectionsResult, lastExamResult] = await Promise.all([
    getGoalsSummary(),
    getStreakCalendar(isoDate(monday), isoDate(addDaysUTC(monday, 6))),
    // The study-modes section only decorates the goal card, so a failure in
    // either of these must never take the whole dashboard down.
    listCollections().then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    listExams({ status: "completed", limit: 1 }).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
  ]);
  // If collections couldn't be loaded, assume some exist rather than
  // greeting a returning user with "create your first collection".
  const collectionCount = collectionsResult.ok ? collectionsResult.value.length : 1;
  const lastExam = lastExamResult.ok ? (lastExamResult.value[0] ?? null) : null;

  return (
    <div className="space-y-8">
      <OnboardingGuideDialog defaultOpen={!user.has_seen_onboarding} />
      <WelcomeHeader username={user.first_name || user.username} />

      {checkout === "success" ? (
        <Alert>
          <AlertDescription>{t("checkoutSuccess")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StreakWidget streak={summary.streak} initialWeek={week.days} />
        <StatCard
          icon={Target}
          label={t("stats.dailyGoal")}
          value={summary.active_goals.length > 0 ? String(summary.daily_due_count) : undefined}
          comingSoon={summary.active_goals.length === 0}
          comingSoonLabel={t("comingSoon")}
          action={
            summary.active_goals.length === 0 ? (
              <GoalIntroDialog
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-turquoise hover:underline"
                  >
                    {t("setGoalCta")}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </button>
                }
              />
            ) : undefined
          }
        />
        <StatCard
          icon={LayoutGrid}
          label={t("stats.cardsStudied")}
          value={String(summary.cards_studied_today)}
        />
      </div>

      <StudyModesSection
        dailyDueCount={summary.daily_due_count}
        dailyTargetTotal={summary.daily_target_total}
        hasActiveGoals={summary.active_goals.length > 0}
        collectionCount={collectionCount}
        lastExamPercent={lastExam?.summary?.score_percent ?? null}
      />
    </div>
  );
}
