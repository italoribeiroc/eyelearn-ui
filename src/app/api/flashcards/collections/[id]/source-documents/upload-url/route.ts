import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { createSourceDocumentUploadUrl } from "@/lib/flashcards/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { content_type: string; filename: string; size_bytes: number };

  try {
    const result = await createSourceDocumentUploadUrl(Number(id), body);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
