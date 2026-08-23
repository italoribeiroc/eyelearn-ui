import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { createCollection } from "@/lib/flashcards/api";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name: string;
    description?: string;
    parent?: number | null;
  };

  try {
    const collection = await createCollection(body);
    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
