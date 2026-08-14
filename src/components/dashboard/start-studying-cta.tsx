import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function StartStudyingCta() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-gradient-to-br from-brand-turquoise/10 to-brand-mint/10 p-6 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent/15">
          <Sparkles className="size-5 text-brand-accent" aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">
            {t("ctaTitle")}
          </p>
          <p className="mt-1 text-sm text-foreground-muted">{t("ctaDescription")}</p>
        </div>
      </div>
      <Button asChild size="lg" className="w-full shrink-0 sm:w-auto">
        <Link href="/study">{t("ctaButton")}</Link>
      </Button>
    </div>
  );
}
