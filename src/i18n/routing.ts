import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt-BR"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Auto-detecting from Accept-Language silently overrides which locale an
  // unprefixed URL renders, which is surprising and untestable (e.g. visiting
  // "/forgot-password" could redirect to "/pt-BR/forgot-password" even with
  // no NEXT_LOCALE cookie). Users pick their language explicitly via
  // <LanguageSwitcher> instead, which sets that cookie and is still honored.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
