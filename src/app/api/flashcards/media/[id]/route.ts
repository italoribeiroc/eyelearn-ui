import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { deleteMedia } from "@/lib/flashcards/api";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteMedia(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
