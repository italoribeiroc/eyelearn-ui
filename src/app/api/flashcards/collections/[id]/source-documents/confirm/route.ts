import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { confirmSourceDocumentUpload } from "@/lib/flashcards/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    storage_key: string;
    content_type: string;
    filename: string;
    size_bytes: number;
  };

  try {
    const document = await confirmSourceDocumentUpload(Number(id), body);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
