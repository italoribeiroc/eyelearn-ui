import "server-only";
import { DjangoApiError, djangoFetchJson } from "@/lib/api/django-client";
import type {
  ExamAnswerPayload,
  ExamAnswerResult,
  ExamCreatePayload,
  ExamDetail,
  ExamListItem,
  ExamStatus,
  ExamStatusCheck,
} from "@/lib/api/types";
import { getValidAccessToken } from "@/lib/auth/session";

/** Same server-only auth pattern as lib/flashcards/api.ts. */
async function authHeaders(): Promise<Record<string, string>> {
  const access = await getValidAccessToken();
  if (!access) throw new DjangoApiError(401, { detail: "Not authenticated." });
  return { Authorization: `Bearer ${access}` };
}

export async function listExams(options?: { status?: ExamStatus; limit?: number }): Promise<ExamListItem[]> {
  const headers = await authHeaders();
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.size ? `?${params}` : "";
  return djangoFetchJson<ExamListItem[]>(`/api/flashcards/exams/${query}`, { headers });
}

export async function createExam(
  payload: ExamCreatePayload,
): Promise<ExamDetail & { skipped_deleted: number }> {
  const headers = await authHeaders();
  return djangoFetchJson(`/api/flashcards/exams/`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function getExam(id: number): Promise<ExamDetail> {
  const headers = await authHeaders();
  return djangoFetchJson<ExamDetail>(`/api/flashcards/exams/${id}/`, { headers });
}

export async function getExamStatus(id: number): Promise<ExamStatusCheck> {
  const headers = await authHeaders();
  return djangoFetchJson<ExamStatusCheck>(`/api/flashcards/exams/${id}/status/`, { headers });
}

export async function answerExamQuestion(
  id: number,
  payload: ExamAnswerPayload,
): Promise<ExamAnswerResult> {
  const headers = await authHeaders();
  return djangoFetchJson<ExamAnswerResult>(`/api/flashcards/exams/${id}/answer/`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function finishExam(id: number): Promise<ExamDetail> {
  const headers = await authHeaders();
  return djangoFetchJson<ExamDetail>(`/api/flashcards/exams/${id}/finish/`, {
    method: "POST",
    headers,
    body: "{}",
  });
}

export async function deleteExam(id: number): Promise<void> {
  const headers = await authHeaders();
  await djangoFetchJson<void>(`/api/flashcards/exams/${id}/`, { method: "DELETE", headers });
}
