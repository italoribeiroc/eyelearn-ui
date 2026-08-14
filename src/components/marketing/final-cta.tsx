import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function FinalCta() {
  const t = useTranslations("finalCta");

  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="text-base">
            <Link href="/register">{t("cta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
