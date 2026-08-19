import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/account/profile-form";
import { SubscriptionSummaryCard } from "@/components/billing/subscription-summary-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscriptionStatus } from "@/lib/billing/subscription";

export default async function AccountPage() {
  const [user, subscription, t] = await Promise.all([
    getCurrentUser(),
    getSubscriptionStatus(),
    getTranslations("account"),
  ]);

  // The (app) layout already redirects unauthenticated visitors to /login,
  // so `user` is guaranteed here -- this is just a type-narrowing guard.
  if (!user) return null;

  return (
    <div className="space-y-10">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("backToDashboard")}
          </Link>
        </Button>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1.5 text-sm text-foreground-muted">{t("subtitle")}</p>
      </div>

      <ProfileForm user={user} />

      {subscription ? <SubscriptionSummaryCard subscription={subscription} /> : null}
    </div>
  );
}
