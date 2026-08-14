import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/auth/session";

export async function POST() {
  const access = await refreshAccessToken();

  if (!access) {
    return NextResponse.json(
      { detail: "Session expired, please log in again." },
      { status: 401 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
