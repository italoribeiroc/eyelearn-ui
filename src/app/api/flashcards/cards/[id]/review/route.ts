import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { submitReview } from "@/lib/flashcards/api";
import type { ReviewSubmission } from "@/lib/api/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as ReviewSubmission;

  try {
    const result = await submitReview(Number(id), body);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
