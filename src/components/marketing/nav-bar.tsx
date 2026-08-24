"use client";

import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useAuthContext } from "@/context/auth-context";
import { Link } from "@/i18n/navigation";

const SECTION_LINKS = [
  { href: "#how-it-works", key: "howItWorks" },
  { href: "#pricing", key: "pricing" },
] as const;

export function NavBar() {
  const t = useTranslations("nav");
  const { isAuthenticated, isLoading } = useAuthContext();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label={t("primaryNavigation")}>
          {SECTION_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher />

          <div className="hidden items-center gap-2 sm:flex">
            {!isLoading && isAuthenticated ? (
              <Button asChild size="sm">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t("logIn")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t("signUp")}</Link>
                </Button>
              </>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={t("openMenu")}
              >
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {SECTION_LINKS.map((link) => (
                <DropdownMenuItem key={link.key} asChild>
                  <a href={link.href}>{t(link.key)}</a>
                </DropdownMenuItem>
              ))}
              {!isLoading && isAuthenticated ? (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">{t("dashboard")}</Link>
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">{t("logIn")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">{t("signUp")}</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
