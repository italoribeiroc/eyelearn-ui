import { NextResponse } from "next/server";
import { DjangoApiError, djangoFetchJson } from "@/lib/api/django-client";
import type { PasswordResetConfirmPayload } from "@/lib/api/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as PasswordResetConfirmPayload;

  try {
    const data = await djangoFetchJson<{ detail: string }>("/api/auth/password-reset/confirm/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return NextResponse.json(data, { status: 200 });
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
