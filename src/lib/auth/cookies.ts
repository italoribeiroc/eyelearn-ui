import "server-only";
import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import {
  ACCESS_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "./constants";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Next.js only allows writing cookies from a Route Handler or Server
 * Action -- reading them (and even fetching a fresh token) is fine from
 * a plain Server Component render, but persisting it isn't. `getCurrentUser()`
 * is called from both contexts, so writes are best-effort here: when called
 * from a layout/page render this silently no-ops, and the client-side
 * `useAuth()` hook's request to the `/api/auth/me` Route Handler persists
 * the refreshed cookie moments later instead.
 */
function trySet(cookies: ResponseCookies, name: string, value: string, options: object) {
  try {
    cookies.set(name, value, options);
  } catch {
    // Not allowed outside a Route Handler/Server Action -- see above.
  }
}

export function setAuthCookies(
  cookies: ResponseCookies,
  tokens: { access: string; refresh?: string },
) {
  trySet(cookies, ACCESS_COOKIE, tokens.access, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  if (tokens.refresh) {
    trySet(cookies, REFRESH_COOKIE, tokens.refresh, {
      ...baseCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }
}

export function clearAuthCookies(cookies: ResponseCookies) {
  trySet(cookies, ACCESS_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
  trySet(cookies, REFRESH_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}
