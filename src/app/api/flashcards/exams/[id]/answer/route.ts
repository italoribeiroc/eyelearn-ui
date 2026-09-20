import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { answerExamQuestion } from "@/lib/flashcards/exam-api";
import type { ExamAnswerPayload } from "@/lib/api/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = (await request.json()) as ExamAnswerPayload;

  try {
    return NextResponse.json(await answerExamQuestion(Number(id), payload));
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
