import { useTranslations } from "next-intl";
import { Logo } from "@/components/shared/logo";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <Logo />
        <p className="text-sm text-foreground-muted">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
