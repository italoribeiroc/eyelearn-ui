import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { getStreakCalendar } from "@/lib/flashcards/goals-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  try {
    const calendar = await getStreakCalendar(start, end);
    return NextResponse.json(calendar);
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
