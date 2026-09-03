import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/constants";

// Same self-contained generateMetadata pattern as (marketing)/page.tsx --
// see that file's comment for why this can't just inherit from the root
// layout for canonical/hreflang.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: absoluteUrl(getPathname({ locale, href: "/terms" })),
      languages: {
        en: absoluteUrl(getPathname({ locale: "en", href: "/terms" })),
        "pt-BR": absoluteUrl(getPathname({ locale: "pt-BR", href: "/terms" })),
        "x-default": absoluteUrl(getPathname({ locale: routing.defaultLocale, href: "/terms" })),
      },
    },
  };
}

// Section order for the document body -- keys match messages/*.json's
// legal.terms.sections.*. "refund" gets an id so the pricing page's money
// back guarantee line can link straight to it.
const SECTION_KEYS = [
  "about",
  "service",
  "eligibility",
  "billing",
  "refund",
  "ai",
  "acceptableUse",
  "termination",
  "ip",
  "liability",
  "changes",
  "governingLaw",
  "contact",
] as const;

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-sm text-foreground-muted">{t("lastUpdated")}</p>

      <div className="mt-8 space-y-8">
        {SECTION_KEYS.map((key) => (
          <section key={key} id={key === "refund" ? "refund-policy" : undefined}>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {t(`sections.${key}.heading`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              {t(`sections.${key}.body`)}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
