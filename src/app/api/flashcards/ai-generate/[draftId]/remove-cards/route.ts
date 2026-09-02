import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { removeAiDraftCards } from "@/lib/flashcards/api";

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const body = (await request.json()) as { card_ids: number[] };

  try {
    const draft = await removeAiDraftCards(Number(draftId), body);
    return NextResponse.json(draft);
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
