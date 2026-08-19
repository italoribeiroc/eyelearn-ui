import { routing } from "@/i18n/routing";

/** Builds a path prefixed for `locale`, matching the `as-needed` prefix rule in `i18n/routing.ts`. */
export function localizedPath(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

/** Currency shown on the pricing page for `locale` -- see `components/marketing/pricing.ts`. */
export function currencyForLocale(locale: string): "usd" | "brl" {
  return locale === "pt-BR" ? "brl" : "usd";
}
