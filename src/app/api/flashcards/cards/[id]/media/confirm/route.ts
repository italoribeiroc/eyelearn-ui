import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { confirmMediaUpload } from "@/lib/flashcards/api";
import type { MediaSide, MediaType } from "@/lib/api/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    storage_key: string;
    media_type: MediaType;
    side: MediaSide;
    content_type: string;
    size_bytes: number;
  };

  try {
    const media = await confirmMediaUpload(Number(id), body);
    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
