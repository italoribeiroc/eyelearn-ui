import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { generateAiFlashcards } from "@/lib/flashcards/api";
import type { Flashcard } from "@/lib/api/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    card_type: Flashcard["card_type"];
    count: number;
    learning_request: string;
  };

  try {
    const draft = await generateAiFlashcards(Number(id), body);
    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
