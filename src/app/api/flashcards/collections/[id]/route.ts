import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { deleteCollection, updateCollection } from "@/lib/flashcards/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Partial<{
    name: string;
    description: string;
    parent: number | null;
  }>;

  try {
    const collection = await updateCollection(Number(id), body);
    return NextResponse.json(collection);
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteCollection(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}
