import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { generateAiFlashcards } from "@/lib/flashcards/api";
import type { Flashcard } from "@/lib/api/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    card_type: Flashcard["card_type"];
    count?: number;
    auto?: boolean;
    learning_request: string;
    source_document_ids?: number[];
  };

  try {
    // Cast: this route is a thin proxy (Django is the real source of
    // validation truth), and the discriminated auto/count union isn't worth
    // reconstructing here from an already-JSON-parsed request body.
    const draft = await generateAiFlashcards(Number(id), body as Parameters<typeof generateAiFlashcards>[1]);
    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
