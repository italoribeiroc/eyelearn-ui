import type { AppLocale } from "@/i18n/routing";

/**
 * Canonical production origin, hardcoded rather than env-driven.
 *
 * Everything that reads this runs server-side only (generateMetadata,
 * sitemap.ts, robots.ts, the JSON-LD component), so there's no reason to
 * introduce this repo's first NEXT_PUBLIC_* var for it. It's also
 * deliberately NOT derived from the current deployment's own URL: a
 * canonical/OG url should always describe the site's real production
 * identity, even when this code happens to be executing on a preview
 * deployment (see robots.ts, which handles "don't index preview" by
 * disallowing crawling there entirely, not by pointing canonicals
 * elsewhere).
 */
export const SITE_URL = "https://eyelearn.app";

// Hardcoded rather than translated, matching existing precedent elsewhere
// in this codebase (appleWebApp.title in [locale]/layout.tsx, logo.tsx,
// footer.tsx's copyright line all hardcode "Eye Learn" rather than pulling
// it from messages/*.json).
export const SITE_NAME = "Eye Learn";

// Open Graph wants underscore-region locale codes, not next-intl's
// hyphenated BCP-47 ones.
export const OG_LOCALE_MAP: Record<AppLocale, string> = {
  en: "en_US",
  "pt-BR": "pt_BR",
};

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
