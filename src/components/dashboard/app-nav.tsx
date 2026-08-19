"use client";

import { useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useAuthContext } from "@/context/auth-context";
import { Link, useRouter } from "@/i18n/navigation";

export function AppNav() {
  const t = useTranslations("dashboard");
  const { logout } = useAuthContext();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-surface/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button asChild type="button" variant="ghost" size="sm">
            <Link href="/account">
              <User className="size-4" aria-hidden="true" />
              {t("account")}
            </Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" aria-hidden="true" />
            {t("logOut")}
          </Button>
        </div>
      </div>
    </header>
  );
}
