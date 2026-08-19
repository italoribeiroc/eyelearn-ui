import { NextResponse } from "next/server";
import { DjangoApiError, djangoFetchJson } from "@/lib/api/django-client";
import type { SubscriptionPlan } from "@/lib/api/types";
import { getValidAccessToken } from "@/lib/auth/session";
import { currencyForLocale, localizedPath } from "@/lib/billing/locale";

type CheckoutRequestBody = {
  plan: Exclude<SubscriptionPlan, "free">;
  locale: string;
};

export async function POST(request: Request) {
  const access = await getValidAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const { plan, locale } = (await request.json()) as CheckoutRequestBody;
  const origin = new URL(request.url).origin;

  try {
    const session = await djangoFetchJson<{ checkout_url: string }>(
      "/api/billing/checkout-session/",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
        body: JSON.stringify({
          plan,
          currency: currencyForLocale(locale),
          success_url: `${origin}${localizedPath(locale, "/dashboard")}?checkout=success`,
          cancel_url: `${origin}${localizedPath(locale, "/")}#pricing`,
        }),
      },
    );

    return NextResponse.json({ checkoutUrl: session.checkout_url });
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
