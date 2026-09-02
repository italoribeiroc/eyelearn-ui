import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { confirmAiGenerationDraft } from "@/lib/flashcards/api";

export async function POST(_request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;

  try {
    const result = await confirmAiGenerationDraft(Number(draftId));
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
