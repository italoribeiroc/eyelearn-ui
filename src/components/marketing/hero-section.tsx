import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { HeroPreviewCard } from "./hero-preview-card";
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

        <HeroPreviewCard />
      </div>
    </section>
  );
}
