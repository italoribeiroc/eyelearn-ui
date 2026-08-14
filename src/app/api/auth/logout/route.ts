import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";

/**
 * The Django backend has no logout/token-blacklist endpoint (stateless
 * JWT, no rest_framework_simplejwt.token_blacklist installed) -- this
 * route only clears the local cookies. It never calls the backend.
 */
export async function POST() {
  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);
  return new NextResponse(null, { status: 204 });
}
