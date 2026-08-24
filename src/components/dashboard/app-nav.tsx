"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Languages, LayoutDashboard, Layers, LogOut, Menu, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { ProBadge } from "@/components/shared/pro-badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { StudyTimerPopover } from "@/components/dashboard/study-timer-popover";
import { useAuthContext } from "@/context/auth-context";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  "pt-BR": "Português (BR)",
};

const noopSubscribe = () => () => {};

/** True only after client hydration -- avoids a server/client theme mismatch flash. */
function useHasMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const menuItemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted";

export function AppNav({ isPro = false }: { isPro?: boolean }) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { logout } = useAuthContext();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="border-b border-border bg-surface/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-1.5">
          <Link href="/dashboard" className="inline-flex items-center">
            <Logo hideWordmarkOnMobile />
          </Link>
          {isPro ? <ProBadge /> : null}
        </div>

        {/* Desktop: full row of controls. */}
        <div className="hidden items-center gap-2 sm:flex">
          <StudyTimerPopover />
          <ThemeToggle />
          <LanguageSwitcher />
          <Button
            asChild
            type="button"
            variant="ghost"
            size="sm"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            className={cn(pathname === "/dashboard" && "bg-muted text-foreground")}
          >
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              {t("dashboardNav")}
            </Link>
          </Button>
          <Button asChild type="button" variant="ghost" size="sm">
            <Link href="/flashcards">
              <Layers className="size-4" aria-hidden="true" />
              {t("flashcards")}
            </Link>
          </Button>
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

        {/* Mobile: only the study timer stays outside the menu, everything else collapses into a slide-in panel. */}
        <div className="flex items-center gap-0.5 sm:hidden">
          <StudyTimerPopover />
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label={t("menu")}>
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent className="p-0">
              <SheetHeader>
                <SheetTitle>{t("menu")}</SheetTitle>
              </SheetHeader>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                <SheetClose asChild>
                  <Link
                    href="/dashboard"
                    aria-current={pathname === "/dashboard" ? "page" : undefined}
                    className={cn(menuItemClass, pathname === "/dashboard" && "bg-muted")}
                  >
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                    {t("dashboardNav")}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/flashcards" className={menuItemClass}>
                    <Layers className="size-4" aria-hidden="true" />
                    {t("flashcards")}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/account" className={menuItemClass}>
                    <User className="size-4" aria-hidden="true" />
                    {t("account")}
                  </Link>
                </SheetClose>

                <div className="my-2 h-px bg-border" />

                <SheetClose asChild>
                  <button
                    type="button"
                    className={menuItemClass}
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                  >
                    {isDark ? (
                      <Sun className="size-4" aria-hidden="true" />
                    ) : (
                      <Moon className="size-4" aria-hidden="true" />
                    )}
                    {tCommon(isDark ? "light" : "dark")}
                  </button>
                </SheetClose>

                <div className="my-2 h-px bg-border" />

                <p className="flex items-center gap-3 px-3 py-1 text-xs font-semibold text-foreground-muted">
                  <Languages className="size-3.5" aria-hidden="true" />
                  {tCommon("language")}
                </p>
                {routing.locales.map((loc) => (
                  <SheetClose key={loc} asChild>
                    <button
                      type="button"
                      className={cn(menuItemClass, "justify-between")}
                      onClick={() => router.replace(pathname, { locale: loc })}
                    >
                      <span>{LOCALE_LABELS[loc] ?? loc}</span>
                      {loc === locale ? (
                        <Check className="size-4 text-brand-turquoise" aria-hidden="true" />
                      ) : null}
                    </button>
                  </SheetClose>
                ))}

                <div className="my-2 h-px bg-border" />

                <SheetClose asChild>
                  <button
                    type="button"
                    className={cn(menuItemClass, "text-destructive hover:bg-destructive/10")}
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    {t("logOut")}
                  </button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
