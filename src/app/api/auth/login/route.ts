import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DjangoApiError, djangoFetchJson } from "@/lib/api/django-client";
import type { AuthTokens, EyeLearnUser, LoginPayload } from "@/lib/api/types";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  const payload = (await request.json()) as LoginPayload;

  try {
    const tokens = await djangoFetchJson<AuthTokens>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, tokens);

    const user = await djangoFetchJson<EyeLearnUser>("/api/auth/me/", {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (error instanceof DjangoApiError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    return NextResponse.json(
      { detail: "Network error while reaching Eye Learn." },
      { status: 502 },
    );
  }
}
