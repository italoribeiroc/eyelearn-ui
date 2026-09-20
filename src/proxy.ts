import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { REFRESH_COOKIE } from "@/lib/auth/constants";

const handleI18nRouting = createMiddleware(routing);

// Path segments that live under the auth-gated (app) route group, kept in
// sync with src/app/[locale]/(app)/*. The (app) layout is still the real
// auth check (it can validate the token against Django and redirect on
// null). This cheap cookie-presence gate exists only so a visitor whose
// session has fully lapsed -- e.g. a tab left open past the 1-day
// refresh-token lifetime, then clicked -- is sent straight to /login,
// instead of the layout's redirect racing a parallel-rendered page whose
// own data fetch throws a 401 first and surfaces the error boundary.
const PROTECTED_SEGMENTS = new Set(["dashboard", "account", "flashcards", "study", "exam", "help"]);

function firstSegmentAfterLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "pt-BR") return segments[1] ?? "";
  return segments[0] ?? "";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsSession = PROTECTED_SEGMENTS.has(firstSegmentAfterLocale(pathname));
  if (needsSession && !request.cookies.has(REFRESH_COOKIE)) {
    const isPtBr = pathname === "/pt-BR" || pathname.startsWith("/pt-BR/");
    return NextResponse.redirect(new URL(isPtBr ? "/pt-BR/login" : "/login", request.nextUrl));
  }

  return handleI18nRouting(request);
}

export const config = {
  // apple-icon/icon/opengraph-image/twitter-image are excluded explicitly:
  // Next serves these metadata-route images at extensionless URLs
  // (e.g. /apple-icon?<hash>), so the `.*\..*` file-extension exclusion
  // below doesn't catch them and next-intl would otherwise 404 them.
  matcher: [
    "/((?!api|_next|_vercel|apple-icon|icon|opengraph-image|twitter-image|.*\\..*).*)",
  ],
};
