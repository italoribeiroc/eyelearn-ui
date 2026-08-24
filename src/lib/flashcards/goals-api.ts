import "server-only";
import { DjangoApiError, djangoFetchJson } from "@/lib/api/django-client";
import type {
  CollectionGoalProgress,
  GoalsSummary,
  StreakCalendar,
  StudyQueueItem,
} from "@/lib/api/types";
import { getValidAccessToken } from "@/lib/auth/session";

/** Same server-only auth pattern as lib/flashcards/api.ts. */
async function authHeaders(): Promise<Record<string, string>> {
  const access = await getValidAccessToken();
  if (!access) throw new DjangoApiError(401, { detail: "Not authenticated." });
  return { Authorization: `Bearer ${access}` };
}

export async function getCollectionGoal(collectionId: number): Promise<CollectionGoalProgress> {
  const headers = await authHeaders();
  return djangoFetchJson<CollectionGoalProgress>(`/api/flashcards/collections/${collectionId}/goal/`, {
    headers,
  });
}

export async function setCollectionGoal(
  collectionId: number,
  targetDate: string,
): Promise<CollectionGoalProgress> {
  const headers = await authHeaders();
  return djangoFetchJson<CollectionGoalProgress>(`/api/flashcards/collections/${collectionId}/goal/`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ target_date: targetDate }),
  });
}

export async function deleteCollectionGoal(collectionId: number): Promise<void> {
  const headers = await authHeaders();
  await djangoFetchJson<void>(`/api/flashcards/collections/${collectionId}/goal/`, {
    method: "DELETE",
    headers,
  });
}

export async function getGoalsSummary(): Promise<GoalsSummary> {
  const headers = await authHeaders();
  return djangoFetchJson<GoalsSummary>("/api/flashcards/goals/summary/", { headers });
}

export async function getStreakCalendar(start: string, end: string): Promise<StreakCalendar> {
  const headers = await authHeaders();
  return djangoFetchJson<StreakCalendar>(`/api/flashcards/streak/?start=${start}&end=${end}`, {
    headers,
  });
}

export async function getDailyStudyQueue(limit?: number): Promise<StudyQueueItem[]> {
  const headers = await authHeaders();
  const query = limit ? `?limit=${limit}` : "";
  return djangoFetchJson<StudyQueueItem[]>(`/api/flashcards/study/daily/${query}`, { headers });
}

export async function getCustomStudyQueue(
  collectionIds: number[],
  limit?: number,
): Promise<StudyQueueItem[]> {
  const headers = await authHeaders();
  const params = new URLSearchParams({ collections: collectionIds.join(",") });
  if (limit) params.set("limit", String(limit));
  return djangoFetchJson<StudyQueueItem[]>(`/api/flashcards/study/custom/?${params.toString()}`, {
    headers,
  });
}
