import { useTranslations } from "next-intl";
import { Logo } from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <Logo />
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <nav className="flex items-center gap-4 text-sm text-foreground-muted">
            <Link href="/terms" className="hover:text-foreground">
              {t("termsLink")}
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              {t("privacyLink")}
            </Link>
          </nav>
          <p className="text-sm text-foreground-muted">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
