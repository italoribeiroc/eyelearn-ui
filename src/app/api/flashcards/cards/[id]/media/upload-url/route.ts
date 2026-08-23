import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { createMediaUploadUrl } from "@/lib/flashcards/api";
import type { MediaSide, MediaType } from "@/lib/api/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    media_type: MediaType;
    side: MediaSide;
    content_type: string;
    filename: string;
    size_bytes: number;
  };

  try {
    const result = await createMediaUploadUrl(Number(id), body);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
