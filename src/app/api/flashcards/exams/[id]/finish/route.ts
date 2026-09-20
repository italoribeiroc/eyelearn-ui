import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { finishExam } from "@/lib/flashcards/exam-api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(await finishExam(Number(id)));
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
