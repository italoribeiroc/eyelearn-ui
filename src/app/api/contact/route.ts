import { NextResponse } from "next/server";
import { djangoErrorResponse, djangoFetchJson } from "@/lib/api/django-client";
import type { ContactPayload } from "@/lib/api/types";
import { getValidAccessToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  const access = await getValidAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const payload = (await request.json()) as ContactPayload;

  try {
    const result = await djangoFetchJson<{ detail: string }>("/api/contact/", {
      method: "POST",
      headers: { Authorization: `Bearer ${access}` },
      body: JSON.stringify(payload),
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
