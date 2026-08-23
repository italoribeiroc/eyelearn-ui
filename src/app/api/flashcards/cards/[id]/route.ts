import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { deleteFlashcard, updateFlashcard } from "@/lib/flashcards/api";
import type { Flashcard } from "@/lib/api/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Partial<{
    card_type: Flashcard["card_type"];
    prompt: string;
    answer: string;
    options: Flashcard["options"];
    accepted_answers: string[];
  }>;

  try {
    const flashcard = await updateFlashcard(Number(id), body);
    return NextResponse.json(flashcard);
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteFlashcard(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
