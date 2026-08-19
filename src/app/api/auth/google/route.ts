import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  GOOGLE_OAUTH_PLAN_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const ALLOWED_PLANS = ["monthly", "annual"];

/**
 * Kicks off the server-side OAuth Authorization Code flow: redirects the
 * browser to Google, no client-side Google SDK or public client ID involved.
 * The callback (./callback/route.ts) does the code exchange and forwards the
 * resulting ID token to Django, mirroring the BFF proxy pattern used by
 * /api/auth/login.
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { detail: "Google OAuth is not configured." },
      { status: 501 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const plan = new URL(request.url).searchParams.get("plan");
  const validPlan = plan && ALLOWED_PLANS.includes(plan) ? plan : null;

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
  };
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
  if (validPlan) {
    cookieStore.set(GOOGLE_OAUTH_PLAN_COOKIE, validPlan, cookieOptions);
  }

  return response;
}
