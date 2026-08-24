import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { deleteCollectionGoal, getCollectionGoal, setCollectionGoal } from "@/lib/flashcards/goals-api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const goal = await getCollectionGoal(Number(id));
    return NextResponse.json(goal);
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { target_date: string };

  try {
    const goal = await setCollectionGoal(Number(id), body.target_date);
    return NextResponse.json(goal);
  } catch (error) {
    const { status, body: errorBody } = djangoErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteCollectionGoal(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
