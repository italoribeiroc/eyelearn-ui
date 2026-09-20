import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { createFlashcard, listFlashcards } from "@/lib/flashcards/api";
import type { Flashcard } from "@/lib/api/types";

/** Card list for one collection: the exam card picker loads these lazily per selected collection. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(await listFlashcards(Number(id)));
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    card_type: Flashcard["card_type"];
    prompt: string;
    answer?: string;
    options?: Flashcard["options"];
    accepted_answers?: string[];
  };

  try {
    const flashcard = await createFlashcard(Number(id), body);
    return NextResponse.json(flashcard, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
