import type { MediaType } from "@/lib/api/types";

/** Mirrors flashcards/services.py's ALLOWED_CONTENT_TYPES / MAX_SIZE_BYTES so bad files are caught client-side. */
export const ALLOWED_CONTENT_TYPES: Record<MediaType, string[]> = {
  image: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  audio: ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

export const MAX_SIZE_BYTES: Record<MediaType, number> = {
  image: 10 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

export function inferMediaType(contentType: string): MediaType | null {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  return null;
}
