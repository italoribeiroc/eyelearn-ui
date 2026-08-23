import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export const proxy = createMiddleware(routing);

export const config = {
  // apple-icon/icon/opengraph-image/twitter-image are excluded explicitly:
  // Next serves these metadata-route images at extensionless URLs
  // (e.g. /apple-icon?<hash>), so the `.*\..*` file-extension exclusion
  // below doesn't catch them and next-intl would otherwise 404 them.
  matcher: [
    "/((?!api|_next|_vercel|apple-icon|icon|opengraph-image|twitter-image|.*\\..*).*)",
  ],
};
