import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { MockFlashcard } from "@/components/shared/mock-flashcard";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-surface-muted/40 px-4 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[36rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--color-brand-mint)_22%,transparent),transparent)]"
      />

      <Link href="/" className="mb-8 inline-flex items-center">
        <Logo size="lg" />
      </Link>

      <div className="w-full max-w-md text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-mint/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-turquoise">
          <Compass className="size-3.5" aria-hidden="true" />
          {t("eyebrow")}
        </p>

        <p className="mt-5 bg-gradient-to-br from-brand-turquoise to-brand-mint bg-clip-text font-heading text-7xl font-extrabold tracking-tight text-transparent sm:text-8xl">
          404
        </p>

        <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base text-foreground-muted">{t("subtitle")}</p>

        <MockFlashcard
          className="mx-auto mt-8 max-w-xs"
          eyebrow={t("card.eyebrow")}
          question={t("card.question")}
          answer={t("card.answer")}
        />

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button asChild size="lg" className="text-base">
            <Link href="/">{t("ctaHome")}</Link>
          </Button>
          <p className="text-sm text-foreground-muted">
            {t("loginPrompt")}{" "}
            <Link href="/login" className="font-medium text-brand-turquoise hover:underline">
              {t("loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
