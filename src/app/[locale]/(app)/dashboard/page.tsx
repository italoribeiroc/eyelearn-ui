import { getTranslations } from "next-intl/server";
import { Flame, LayoutGrid, Target } from "lucide-react";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StartStudyingCta } from "@/components/dashboard/start-studying-cta";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("dashboard")]);

  // The (app) layout already redirects unauthenticated visitors to /login,
  // so `user` is guaranteed here -- this is just a type-narrowing guard.
  if (!user) return null;

  return (
    <div className="space-y-8">
      <WelcomeHeader username={user.username} />

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
