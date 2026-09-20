import type {
  ExamAnswerPayload,
  ExamAnswerResult,
  ExamCreatePayload,
  ExamDetail,
  ExamResult,
  ExamStatusCheck,
  Flashcard,
} from "@/lib/api/types";

/** Browser-side calls to the exam BFF routes (see src/app/api/flashcards/exams). */
export class ExamRequestError extends Error {
  status: number;
  /** Stable backend error code (e.g. "exam_completed"), when the backend sent one. */
  code: string | null;

  constructor(status: number, code: string | null) {
    super(`Exam request failed with status ${status}`);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    // Offline / network drop: distinguishable from an HTTP error so callers can retry.
    throw new ExamRequestError(0, "network");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { code?: string } | null;
    throw new ExamRequestError(response.status, body?.code ?? null);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function createExamRequest(payload: ExamCreatePayload) {
  return request<ExamDetail & { skipped_deleted: number }>("/api/flashcards/exams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function answerExamRequest(examId: number, payload: ExamAnswerPayload) {
  return request<ExamAnswerResult>(`/api/flashcards/exams/${examId}/answer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function finishExamRequest(examId: number) {
  return request<ExamResult>(`/api/flashcards/exams/${examId}/finish`, {
    method: "POST",
    body: "{}",
  });
}

export function examStatusRequest(examId: number) {
  return request<ExamStatusCheck>(`/api/flashcards/exams/${examId}/status`);
}

export function deleteExamRequest(examId: number) {
  return request<void>(`/api/flashcards/exams/${examId}`, { method: "DELETE" });
}

export function collectionFlashcardsRequest(collectionId: number) {
  return request<Flashcard[]>(
    `/api/flashcards/collections/${collectionId}/flashcards`,
  );
}
