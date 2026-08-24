import { getLocale } from "next-intl/server";
import { Logo } from "@/components/shared/logo";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  if (user) {
    redirect({ href: "/dashboard", locale });
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-surface-muted/40 px-4 py-12">
      <Link href="/" className="mb-4 inline-flex items-center">
        <Logo size="lg" layout="centered" />
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-[var(--shadow-soft-lg)]">
        {children}
      </div>
    </div>
  );
}
