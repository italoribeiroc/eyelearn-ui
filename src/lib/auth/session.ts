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
  } catch {
    clearAuthCookies(cookieStore);
    return null;
  }
}

/**
 * Reads the access cookie, refreshing once if it's missing/expired.
 * Returns null if the visitor has no usable session. Shared by
 * `getCurrentUser()` and any other server-only code (e.g. billing) that
 * just needs a bearer token without also wanting the full user object.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;
  if (access) return access;

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
