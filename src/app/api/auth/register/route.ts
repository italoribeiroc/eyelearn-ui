import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DjangoApiError, djangoFetchJson } from "@/lib/api/django-client";
import type { AuthTokens, EyeLearnUser, RegisterPayload } from "@/lib/api/types";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: Request) {
  const payload = (await request.json()) as RegisterPayload;

  try {
    const data = await djangoFetchJson<AuthTokens & { user: EyeLearnUser }>(
      "/api/auth/register/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, data);

    return NextResponse.json({ user: data.user }, { status: 201 });
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
