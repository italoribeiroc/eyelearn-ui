import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DjangoApiError, djangoFetch, djangoFetchJson } from "@/lib/api/django-client";
import type { EyeLearnUser } from "@/lib/api/types";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { getCurrentUser, getValidAccessToken } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const access = await getValidAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const payload = await request.json();

  try {
    const user = await djangoFetchJson<EyeLearnUser>("/api/auth/me/", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${access}` },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ user });
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

export async function DELETE(request: Request) {
  const access = await getValidAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  const payload = await request.json();

  try {
    const response = await djangoFetch("/api/auth/me/", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${access}` },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return NextResponse.json(body, { status: response.status });
    }

    // Account is gone -- these JWT cookies are now meaningless, clear them
    // immediately instead of leaving them to sit until they expire.
    const cookieStore = await cookies();
    clearAuthCookies(cookieStore);

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { detail: "Network error while reaching Eye Learn." },
      { status: 502 },
    );
  }
}
