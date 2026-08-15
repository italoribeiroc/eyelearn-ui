import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { djangoFetchJson } from "@/lib/api/django-client";
import type { AuthTokens, GoogleAuthPayload } from "@/lib/api/types";
import { setAuthCookies } from "@/lib/auth/cookies";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/auth/constants";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function loginErrorRedirect(request: Request) {
  return NextResponse.redirect(
    new URL("/login?error=google_auth_failed", request.url),
  );
}

/**
 * Google redirects here after the user grants consent. This exchanges the
 * auth code for a Google ID token (server-to-server, holds the client
 * secret), then hands that ID token to Django for verification -- mirroring
 * how /api/auth/login proxies to Django and sets httpOnly cookies. The
 * browser never talks to Google's token endpoint or to Django directly.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginErrorRedirect(request);
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { detail: "Google OAuth is not configured." },
      { status: 501 },
    );
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      return loginErrorRedirect(request);
    }

    const { id_token: idToken } = (await tokenResponse.json()) as {
      id_token?: string;
    };

    if (!idToken) {
      return loginErrorRedirect(request);
    }

    const tokens = await djangoFetchJson<AuthTokens>("/api/auth/google/", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken } satisfies GoogleAuthPayload),
    });

    setAuthCookies(cookieStore, tokens);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch {
    return loginErrorRedirect(request);
  }
}
