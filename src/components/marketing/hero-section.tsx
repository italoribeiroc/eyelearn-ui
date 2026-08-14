import { useTranslations } from "next-intl";
import { Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { HeroWordMorph } from "./hero-word-morph";

export function HeroSection() {
  const t = useTranslations("hero");

  const morphPhrases = [
    t("morph.eye"),
    t("morph.i"),
    t("morph.aye"),
    t("morph.ai"),
    t("morph.seeIt"),
    t("morph.practice"),
    t("morph.remember"),
    t("morph.masterIt"),
    t("morph.final"),
  ];

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[36rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--color-brand-mint)_22%,transparent),transparent)]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-5 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <HeroWordMorph phrases={morphPhrases} />
            <span className="ml-2">{t("morphSuffix")}</span>
          </p>

          <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("headline")}
          </h1>

          <p className="mt-6 max-w-xl text-lg text-foreground-muted sm:text-xl">
            {t("subheadline")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href="/register">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link href="/login">{t("ctaSecondary")}</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-foreground-muted">{t("ctaHint")}</p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand-mint/15 px-3 py-1 text-xs font-semibold text-brand-turquoise">
                {t("previewCard.tag")}
              </span>
              <Sparkles className="size-4 text-brand-accent" aria-hidden="true" />
            </div>
            <p className="mt-5 font-heading text-xl font-semibold text-foreground">
              {t("previewCard.question")}
            </p>
            <p className="mt-3 text-sm text-foreground-muted">
              {t("previewCard.hint")}
            </p>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent">
                <Flame className="size-4" aria-hidden="true" />
                {t("previewCard.streak")}
              </span>
              <span className="text-xs text-foreground-muted">
                {t("previewCard.progress")}
              </span>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute -bottom-6 -left-6 hidden rotate-[-6deg] rounded-lg border border-border bg-surface px-4 py-3 shadow-[var(--shadow-soft)] sm:block"
          >
            <p className="text-xs font-medium text-foreground-muted">
              {t("previewCard.floatingLabel")}
            </p>
            <p className="font-heading text-lg font-bold text-brand-turquoise">
              {t("previewCard.floatingValue")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
