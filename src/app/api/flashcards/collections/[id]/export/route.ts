import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { toCsv } from "@/lib/flashcards/csv";
import { getCollection, listFlashcards } from "@/lib/flashcards/api";

const HEADER = ["card_type", "prompt", "answer", "options", "accepted_answers"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collectionId = Number(id);

  try {
    const [collection, flashcards] = await Promise.all([
      getCollection(collectionId),
      listFlashcards(collectionId),
    ]);

    const rows = [
      HEADER,
      ...flashcards.map((flashcard) => [
        flashcard.card_type,
        flashcard.prompt,
        flashcard.answer,
        flashcard.card_type === "multiple_choice" ? JSON.stringify(flashcard.options) : "",
        flashcard.card_type === "typed_answer" ? flashcard.accepted_answers.join(";") : "",
      ]),
    ];

    const csv = toCsv(rows);
    const filename = `${collection.name.replace(/[^\w.-]+/g, "_") || "flashcards"}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
