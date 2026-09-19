import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt-BR"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // A first-time visitor's language comes from their device/browser
  // Accept-Language header: any Portuguese variant (pt, pt-BR, pt-PT) gets
  // pt-BR, everything else falls back to English (the default locale).
  // An explicit choice always wins over detection: <LanguageSwitcher> sets
  // the NEXT_LOCALE cookie, which next-intl checks before Accept-Language,
  // and any URL that already carries a locale prefix (/pt-BR/...) is honored
  // as-is. Only unprefixed URLs with no cookie get detected.
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];
