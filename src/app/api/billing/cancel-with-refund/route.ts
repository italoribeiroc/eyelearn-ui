import { NextResponse } from "next/server";
import { djangoErrorResponse, djangoFetchJson } from "@/lib/api/django-client";
import type { SubscriptionStatus } from "@/lib/api/types";
import { getValidAccessToken } from "@/lib/auth/session";

export async function POST() {
  const access = await getValidAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  try {
    const subscription = await djangoFetchJson<SubscriptionStatus>(
      "/api/billing/cancel-with-refund/",
      { method: "POST", headers: { Authorization: `Bearer ${access}` } },
    );
    return NextResponse.json({ subscription });
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
