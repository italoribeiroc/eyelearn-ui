import { getLocale } from "next-intl/server";
import { AppNav } from "@/components/dashboard/app-nav";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscriptionStatus } from "@/lib/billing/subscription";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, locale, subscription] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getSubscriptionStatus(),
  ]);

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const isPro = subscription?.plan !== "free" && subscription?.plan != null;

  return (
    <div className="flex min-h-svh flex-col bg-surface-muted/30">
      <AppNav isPro={isPro} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
