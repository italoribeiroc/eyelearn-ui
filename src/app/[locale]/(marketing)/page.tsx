import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/marketing/hero-section";
import { ValuePropSection } from "@/components/marketing/value-prop-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { AiFeatureShowcase } from "@/components/marketing/ai-feature-showcase";
import { StreakShowcase } from "@/components/marketing/streak-showcase";
import { ProductPreview } from "@/components/marketing/product-preview";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/marketing/json-ld";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { absoluteUrl, OG_LOCALE_MAP, SITE_NAME, SITE_URL } from "@/lib/seo/constants";

// This page (not the root [locale]/layout.tsx) owns every URL-specific
// metadata field. The layout's generateMetadata wraps every route under
// [locale] and only ever sees { locale } -- it can't know which page is
// rendering, so it can't correctly set a per-page canonical/openGraph.url.
// This is currently the one route that's unambiguously always at "/", so
// it's the only place a correct canonical can live. Fields below are also
// deliberately self-contained (re-reading the same metadata.* keys the
// layout reads) rather than relying on inheriting from the layout: Next's
// metadata merging *replaces* object-valued fields like openGraph/twitter
// wholesale on any child override, so partial-field inheritance across
// layout and page is fragile -- self-contained avoids that entirely.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations({ locale, namespace: "metadata" });
  const otherLocale = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  const canonical = absoluteUrl(getPathname({ locale, href: "/" }));
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: absoluteUrl(getPathname({ locale: "en", href: "/" })),
        "pt-BR": absoluteUrl(getPathname({ locale: "pt-BR", href: "/" })),
        // No auto locale-detection redirect happens on this site
        // (localeDetection: false in i18n/routing.ts), so x-default
        // honestly points at the same URL as the real default locale (en)
        // rather than implying a redirect that doesn't exist.
        "x-default": absoluteUrl(getPathname({ locale: routing.defaultLocale, href: "/" })),
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE_MAP[locale],
      alternateLocale: OG_LOCALE_MAP[otherLocale],
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations({ locale, namespace: "metadata" });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              logo: absoluteUrl("/icon.svg"),
            },
            {
              "@type": "SoftwareApplication",
              name: SITE_NAME,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              url: SITE_URL,
              description: t("description"),
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: locale === "pt-BR" ? "BRL" : "USD",
              },
            },
          ],
        }}
      />
      <HeroSection />
      <ValuePropSection />
      <HowItWorksSection />
      <AiFeatureShowcase />
      <StreakShowcase />
      <ProductPreview />
      <BenefitsSection />
      <PricingSection />
      <FinalCta />
    </>
  );
}
