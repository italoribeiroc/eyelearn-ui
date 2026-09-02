import "server-only";
import { DjangoApiError, djangoFetchJson, djangoFetchJsonLoggingHeader } from "@/lib/api/django-client";
import type {
  AiGenerationConfirmResult,
  AiGenerationDraft,
  Collection,
  Flashcard,
  FlashcardMediaItem,
  MediaSide,
  MediaType,
  ReviewResult,
  ReviewSubmission,
  StudyQueueItem,
} from "@/lib/api/types";
import { getValidAccessToken } from "@/lib/auth/session";

/**
 * Server-only wrapper around the Django flashcards API, used both directly
 * from Server Components (initial page reads) and from the BFF route
 * handlers under src/app/api/flashcards/* (client-triggered mutations).
 * Mirrors the auth pattern in lib/billing/subscription.ts.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const access = await getValidAccessToken();
  if (!access) throw new DjangoApiError(401, { detail: "Not authenticated." });
  return { Authorization: `Bearer ${access}` };
}

export async function listCollections(parentId?: number | null): Promise<Collection[]> {
  const headers = await authHeaders();
  const query = parentId === null ? "?parent=null" : parentId ? `?parent=${parentId}` : "";
  return djangoFetchJson<Collection[]>(`/api/flashcards/collections/${query}`, { headers });
}

export async function getCollection(id: number): Promise<Collection> {
  const headers = await authHeaders();
  return djangoFetchJson<Collection>(`/api/flashcards/collections/${id}/`, { headers });
}

export async function createCollection(data: {
  name: string;
  description?: string;
  parent?: number | null;
}): Promise<Collection> {
  const headers = await authHeaders();
  return djangoFetchJson<Collection>("/api/flashcards/collections/", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function updateCollection(
  id: number,
  data: Partial<{ name: string; description: string; parent: number | null }>,
): Promise<Collection> {
  const headers = await authHeaders();
  return djangoFetchJson<Collection>(`/api/flashcards/collections/${id}/`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
}

export async function deleteCollection(id: number): Promise<void> {
  const headers = await authHeaders();
  await djangoFetchJson<void>(`/api/flashcards/collections/${id}/`, {
    method: "DELETE",
    headers,
  });
}

export async function listFlashcards(collectionId: number): Promise<Flashcard[]> {
  const headers = await authHeaders();
  return djangoFetchJson<Flashcard[]>(`/api/flashcards/collections/${collectionId}/flashcards/`, {
    headers,
  });
}

export async function createFlashcard(
  collectionId: number,
  data: {
    card_type: Flashcard["card_type"];
    prompt: string;
    answer?: string;
    options?: Flashcard["options"];
    accepted_answers?: string[];
  },
): Promise<Flashcard> {
  const headers = await authHeaders();
  return djangoFetchJson<Flashcard>(`/api/flashcards/collections/${collectionId}/flashcards/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function updateFlashcard(
  id: number,
  data: Partial<{
    card_type: Flashcard["card_type"];
    prompt: string;
    answer: string;
    options: Flashcard["options"];
    accepted_answers: string[];
  }>,
): Promise<Flashcard> {
  const headers = await authHeaders();
  return djangoFetchJson<Flashcard>(`/api/flashcards/flashcards/${id}/`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
}

export async function deleteFlashcard(id: number): Promise<void> {
  const headers = await authHeaders();
  await djangoFetchJson<void>(`/api/flashcards/flashcards/${id}/`, {
    method: "DELETE",
    headers,
  });
}

export async function getStudyQueue(
  collectionId: number,
  limit?: number,
): Promise<StudyQueueItem[]> {
  const headers = await authHeaders();
  const query = limit ? `?limit=${limit}` : "";
  return djangoFetchJson<StudyQueueItem[]>(
    `/api/flashcards/collections/${collectionId}/study-queue/${query}`,
    { headers },
  );
}

export async function submitReview(
  flashcardId: number,
  data: ReviewSubmission,
): Promise<ReviewResult> {
  const headers = await authHeaders();
  return djangoFetchJson<ReviewResult>(`/api/flashcards/flashcards/${flashcardId}/review/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function createMediaUploadUrl(
  flashcardId: number,
  data: {
    media_type: MediaType;
    side: MediaSide;
    content_type: string;
    filename: string;
    size_bytes: number;
  },
): Promise<{ storage_key: string; upload_url: string }> {
  const headers = await authHeaders();
  return djangoFetchJson(`/api/flashcards/flashcards/${flashcardId}/media/upload-url/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function confirmMediaUpload(
  flashcardId: number,
  data: {
    storage_key: string;
    media_type: MediaType;
    side: MediaSide;
    content_type: string;
    size_bytes: number;
  },
): Promise<FlashcardMediaItem> {
  const headers = await authHeaders();
  return djangoFetchJson<FlashcardMediaItem>(
    `/api/flashcards/flashcards/${flashcardId}/media/confirm/`,
    { method: "POST", headers, body: JSON.stringify(data) },
  );
}

export async function deleteMedia(mediaId: number): Promise<void> {
  const headers = await authHeaders();
  await djangoFetchJson<void>(`/api/flashcards/media/${mediaId}/`, {
    method: "DELETE",
    headers,
  });
}

export async function generateAiFlashcards(
  collectionId: number,
  data: { card_type: Flashcard["card_type"]; learning_request: string } & (
    | { auto: true; count?: never }
    | { auto?: false; count: number }
  ),
): Promise<AiGenerationDraft> {
  const headers = await authHeaders();
  return djangoFetchJsonLoggingHeader<AiGenerationDraft>(
    `/api/flashcards/collections/${collectionId}/ai-generate/`,
    "X-AI-Provider",
    "ai-generate",
    { method: "POST", headers, body: JSON.stringify(data) },
  );
}

export async function getAiGenerationDraft(draftId: number): Promise<AiGenerationDraft> {
  const headers = await authHeaders();
  return djangoFetchJson<AiGenerationDraft>(`/api/flashcards/ai-generate/${draftId}/`, { headers });
}

export async function generateNextAiBatch(draftId: number): Promise<AiGenerationDraft> {
  const headers = await authHeaders();
  return djangoFetchJsonLoggingHeader<AiGenerationDraft>(
    `/api/flashcards/ai-generate/${draftId}/generate-next-batch/`,
    "X-AI-Provider",
    "ai-generate-next-batch",
    { method: "POST", headers },
  );
}

export async function regenerateAiDraftCards(
  draftId: number,
  data: { selected_ids: number[]; instruction: string },
): Promise<AiGenerationDraft> {
  const headers = await authHeaders();
  return djangoFetchJsonLoggingHeader<AiGenerationDraft>(
    `/api/flashcards/ai-generate/${draftId}/regenerate/`,
    "X-AI-Provider",
    "ai-regenerate",
    { method: "POST", headers, body: JSON.stringify(data) },
  );
}

export async function removeAiDraftCards(
  draftId: number,
  data: { card_ids: number[] },
): Promise<AiGenerationDraft> {
  const headers = await authHeaders();
  return djangoFetchJson<AiGenerationDraft>(`/api/flashcards/ai-generate/${draftId}/remove-cards/`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function confirmAiGenerationDraft(draftId: number): Promise<AiGenerationConfirmResult> {
  const headers = await authHeaders();
  return djangoFetchJson<AiGenerationConfirmResult>(`/api/flashcards/ai-generate/${draftId}/confirm/`, {
    method: "POST",
    headers,
  });
}

export async function discardAiGenerationDraft(draftId: number): Promise<{ status: string }> {
  const headers = await authHeaders();
  return djangoFetchJson<{ status: string }>(`/api/flashcards/ai-generate/${draftId}/discard/`, {
    method: "POST",
    headers,
  });
}
