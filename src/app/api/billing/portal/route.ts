import { NextResponse } from "next/server";
import { DjangoApiError, djangoFetchJson } from "@/lib/api/django-client";
import { getValidAccessToken } from "@/lib/auth/session";
import { localizedPath } from "@/lib/billing/locale";

type PortalRequestBody = {
  locale: string;
  changePlan?: boolean;
};

export async function POST(request: Request) {
  const access = await getValidAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const { locale, changePlan } = (await request.json()) as PortalRequestBody;
  const origin = new URL(request.url).origin;

  try {
    const session = await djangoFetchJson<{ portal_url: string }>(
      "/api/billing/portal-session/",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
        body: JSON.stringify({
          return_url: `${origin}${localizedPath(locale, "/dashboard")}`,
          change_plan: changePlan ?? false,
        }),
      },
    );

    return NextResponse.json({ portalUrl: session.portal_url });
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
