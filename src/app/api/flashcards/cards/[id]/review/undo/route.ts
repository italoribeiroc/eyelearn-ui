import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { undoReview } from "@/lib/flashcards/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const result = await undoReview(Number(id));
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
