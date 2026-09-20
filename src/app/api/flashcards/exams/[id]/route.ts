import { NextResponse } from "next/server";
import { djangoErrorResponse } from "@/lib/api/django-client";
import { deleteExam, getExam } from "@/lib/flashcards/exam-api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    return NextResponse.json(await getExam(Number(id)));
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await deleteExam(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { status, body } = djangoErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
