import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { createExam, listExams } from "@/lib/flashcards/exam-api";
import type { ExamCreatePayload, ExamStatus } from "@/lib/api/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ExamStatus | null;
  const limit = Number(searchParams.get("limit")) || undefined;

  try {
    return NextResponse.json(await listExams({ status: status ?? undefined, limit }));
  } catch (error) {
    const { status: code, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status: code });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ExamCreatePayload;

  try {
    return NextResponse.json(await createExam(payload), { status: 201 });
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
