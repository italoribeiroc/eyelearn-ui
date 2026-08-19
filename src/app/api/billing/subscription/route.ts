import { NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/billing/subscription";

export async function GET() {
  const subscription = await getSubscriptionStatus();

  if (!subscription) {
    return NextResponse.json({ detail: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json({ subscription });
}
