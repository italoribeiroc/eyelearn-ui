import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/constants";

// Hand-maintained, not `new Date()` evaluated at build/request time -- a
// live timestamp would claim "modified today" on every single deploy
// regardless of whether the landing page's actual content changed, which
// conflicts with this repo's "never fabricate data" convention (the same
// reasoning behind the dashboard's "Coming soon" stat cards). Bump this by
// hand whenever the landing page's real content meaningfully changes.
const LANDING_PAGE_LAST_MODIFIED = new Date("2026-09-02");

// A small route table, not a flat hardcoded list of URLs, so a future
// indexable page (out of scope for now -- see the SEO plan) is a one-line
// addition here rather than a rewrite of the locale/hreflang fan-out logic
// below.
const routes: {
  path: string;
  lastModified: Date;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", lastModified: LANDING_PAGE_LAST_MODIFIED, changeFrequency: "monthly", priority: 1 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(getPathname({ locale, href: route.path })),
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      // The default locale's URL is the "real" one; other locales are
      // equally valid alternates but not the primary ranking target.
      priority: locale === routing.defaultLocale ? route.priority : route.priority * 0.8,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, absoluteUrl(getPathname({ locale: l, href: route.path }))]),
        ),
      },
    })),
  );
}
