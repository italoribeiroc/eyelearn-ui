import { notFound } from "next/navigation";
import { ExamResults } from "@/components/exam/exam-results";
import { ExamSession } from "@/components/exam/exam-session";
import { DjangoApiError } from "@/lib/api/django-client";
import { getExam } from "@/lib/flashcards/exam-api";

export default async function ExamRunPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const id = Number(examId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let exam;
  try {
    exam = await getExam(id);
  } catch (error) {
    if (error instanceof DjangoApiError && error.status === 404) notFound();
    throw error;
  }

  return exam.status === "in_progress" ? <ExamSession exam={exam} /> : <ExamResults result={exam} />;
}
