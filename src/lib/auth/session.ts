import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { DjangoApiError, djangoFetchJson } from "@/lib/api/django-client";
import type { EyeLearnUser } from "@/lib/api/types";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./constants";
import { clearAuthCookies, setAuthCookies } from "./cookies";

/**
 * Reads the refresh cookie and, if valid, obtains a fresh access token
 * from Django and writes it back as a cookie. Returns the new access
 * token, or null if there is no usable refresh token (caller should
 * treat this as "session expired").
 */
export async function refreshAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refresh) {
    return null;
  }

  try {
    const data = await djangoFetchJson<{ access: string }>(
      "/api/auth/refresh/",
      {
        method: "POST",
        body: JSON.stringify({ refresh }),
      },
    );

    setAuthCookies(cookieStore, { access: data.access });
    return data.access;
  } catch (error) {
    // Only a refresh token Django actually rejected means the session is
    // over. A rate limit (429), a server error, or a network blip says
    // nothing about the refresh token, so keep the cookies: wiping them
    // here would log the user out for good over a problem that clears up
    // by itself (the refresh endpoint is throttled, and a burst of
    // parallel requests after the access token expires can hit that).
    const rejected = error instanceof DjangoApiError && (error.status === 400 || error.status === 401);
    if (rejected) clearAuthCookies(cookieStore);
    return null;
  }
}

// Refresh this many seconds before the token's real expiry, not exactly at
// it -- otherwise a token that's valid when read but expires a moment
// later (mid-flight to Django) would still 401.
const EXPIRY_SAFETY_MARGIN_SECONDS = 15;

/**
 * Reads a JWT's `exp` claim without verifying its signature -- fine here
 * since the token only ever came from our own httpOnly cookie (set by our
 * own server from Django's own response); this is purely a local "is it
 * worth even trying this token" check, not an authorization decision.
 * Returns null if the token isn't a well-formed JWT.
 */
function readJwtExpiry(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

/**
 * Reads the access cookie, refreshing if it's missing OR its own `exp`
 * claim says it's expired (or about to be). Checking the claim directly
 * -- not just whether the cookie is present -- matters for any code path
 * that makes many sequential Django calls over a stretch of real time
 * within one browser session (e.g. a large multi-batch import): the
 * cookie's own Max-Age nominally matches the JWT's lifetime, but relying
 * on the browser to evict it on the exact same clock as Django checks
 * expiry isn't reliable enough -- without this check, a request made just
 * past actual expiry but before browser eviction would silently 401 with
 * no recovery, since nothing downstream of this function retries on 401.
 * Returns null if the visitor has no usable session. Shared by
 * `getCurrentUser()` and any other server-only code (e.g. billing,
 * `lib/flashcards/api.ts`) that just needs a bearer token without also
 * wanting the full user object.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;
  if (access) {
    const exp = readJwtExpiry(access);
    // No readable exp claim: trust the cookie rather than force a refresh
    // on every call (defensive fallback, shouldn't happen for a real
    // simplejwt token).
    if (exp === null || exp * 1000 > Date.now() + EXPIRY_SAFETY_MARGIN_SECONDS * 1000) {
      return access;
    }
  }

  return refreshAccessToken();
}

/**
 * Server-side helper for reading the current user from the access
 * cookie, transparently refreshing once on a 401. Returns null if the
 * visitor is not authenticated (expired refresh token included).
 * Wrapped in React's `cache()` so the (app) layout's auth gate and a
 * page rendered under it share one Django request per render pass.
 */
export const getCurrentUser = cache(async (): Promise<EyeLearnUser | null> => {
  const access = await getValidAccessToken();
  if (!access) return null;

  try {
    return await djangoFetchJson<EyeLearnUser>("/api/auth/me/", {
      headers: { Authorization: `Bearer ${access}` },
    });
  } catch (error) {
    if (error instanceof DjangoApiError && error.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return null;

      try {
        return await djangoFetchJson<EyeLearnUser>("/api/auth/me/", {
          headers: { Authorization: `Bearer ${refreshed}` },
        });
      } catch {
        return null;
      }
    }

    return null;
  }
});
