import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { getAiGenerationDraft } from "@/lib/flashcards/api";

export async function GET(_request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;

  try {
    const draft = await getAiGenerationDraft(Number(draftId));
    return NextResponse.json(draft);
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
