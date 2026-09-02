import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/constants";

// Auth-gated real content, under (app)/ -- never worth indexing, and
// crawling it would just hit the login redirect anyway.
const APP_SEGMENTS = ["dashboard", "flashcards", "study", "account", "help"];

// Not auth-gated, but not marketing content either -- thin logged-out
// account-action pages that would otherwise show up as low-value/
// duplicate-across-locale search results.
const AUTH_SEGMENTS = ["login", "register", "forgot-password", "reset-password", "verify-email"];

function disallowedPaths(): string[] {
  const segments = [...APP_SEGMENTS, ...AUTH_SEGMENTS];
  const paths = routing.locales.flatMap((locale) => {
    // Mirrors localePrefix: "as-needed" -- en is unprefixed, pt-BR is
    // "/pt-BR", so both forms need their own disallow entry.
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    return segments.map((segment) => `${prefix}/${segment}`);
  });
  return [...paths, "/api/"];
}

export default function robots(): MetadataRoute.Robots {
  // Vercel sets VERCEL_ENV to "production" on the Production deployment and
  // "preview" on every Preview deployment (which is what
  // eyelearn-staging.vercel.app is) -- automatic, no manual config needed.
  // Anything that isn't a real production request (including local `npm
  // run dev`, where this is unset) gets a blanket disallow, so a staging/
  // preview deploy never gets indexed as duplicate content.
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: disallowedPaths() },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
