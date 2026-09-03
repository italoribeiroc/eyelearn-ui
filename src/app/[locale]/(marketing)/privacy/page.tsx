import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: absoluteUrl(getPathname({ locale, href: "/privacy" })),
      languages: {
        en: absoluteUrl(getPathname({ locale: "en", href: "/privacy" })),
        "pt-BR": absoluteUrl(getPathname({ locale: "pt-BR", href: "/privacy" })),
        "x-default": absoluteUrl(getPathname({ locale: routing.defaultLocale, href: "/privacy" })),
      },
    },
  };
}

// Plain {heading, body} sections, rendered before and after the "share"
// section below (the one exception -- a bulleted third-party list, not a
// plain heading/body pair).
const SECTIONS_BEFORE_SHARE = ["intro", "collect", "use"] as const;
const SECTIONS_AFTER_SHARE = [
  "cookies",
  "retention",
  "rights",
  "security",
  "children",
  "transfers",
  "changes",
  "contact",
] as const;

const SHARE_LIST_KEYS = ["stripe", "resend", "google", "ai"] as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-sm text-foreground-muted">{t("lastUpdated")}</p>

      <div className="mt-8 space-y-8">
        {SECTIONS_BEFORE_SHARE.map((key) => (
          <section key={key}>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {t(`sections.${key}.heading`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              {t(`sections.${key}.body`)}
            </p>
          </section>
        ))}

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("sections.share.heading")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            {t("sections.share.intro")}
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground-muted">
            {SHARE_LIST_KEYS.map((key) => (
              <li key={key}>{t(`sections.share.${key}`)}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            {t("sections.share.outro")}
          </p>
        </section>

        {SECTIONS_AFTER_SHARE.map((key) => (
          <section key={key}>
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
