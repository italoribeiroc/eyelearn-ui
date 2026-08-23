"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MediaPreviewTile } from "@/components/flashcards/media-preview-tile";
import { useRouter } from "@/i18n/navigation";
import { ALLOWED_CONTENT_TYPES, MAX_SIZE_BYTES, inferMediaType } from "@/lib/flashcards/media-constraints";
import type { FlashcardMediaItem, MediaSide } from "@/lib/api/types";

/**
 * Upload flow matches flashcards/storage.py: get a presigned PUT URL from
 * Django (via our BFF), PUT the file bytes directly to the bucket from the
 * browser (never through our server -- that's the point of presigned
 * uploads), then confirm so Django creates the FlashcardMedia row.
 *
 * Used in edit mode, where the flashcard already has an id so each pick
 * uploads immediately. Create mode uses StagedMediaField instead, since
 * there's no flashcard to attach to until the card itself is saved.
 */
export function MediaAttachmentField({
  flashcardId,
  side,
  initialMedia,
}: {
  flashcardId: number;
  side: MediaSide;
  initialMedia: FlashcardMediaItem[];
}) {
  const t = useTranslations("flashcards.media");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState(() => initialMedia.filter((item) => item.side === side));
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const mediaType = inferMediaType(file.type);
    if (!mediaType || !ALLOWED_CONTENT_TYPES[mediaType].includes(file.type)) {
      toast.error(t("unsupportedType"));
      return;
    }
    if (file.size > MAX_SIZE_BYTES[mediaType]) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const urlRes = await fetch(`/api/flashcards/cards/${flashcardId}/media/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: mediaType,
          side,
          content_type: file.type,
          filename: file.name,
          size_bytes: file.size,
        }),
      });
      if (!urlRes.ok) {
        const body = (await urlRes.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? tErrors("generic"));
      }
      const { storage_key, upload_url } = (await urlRes.json()) as {
        storage_key: string;
        upload_url: string;
      };

      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(tErrors("network"));

      const confirmRes = await fetch(`/api/flashcards/cards/${flashcardId}/media/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_key,
          media_type: mediaType,
          side,
          content_type: file.type,
          size_bytes: file.size,
        }),
      });
      if (!confirmRes.ok) {
        const body = (await confirmRes.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? tErrors("generic"));
      }
      const created = (await confirmRes.json()) as FlashcardMediaItem;

      setMedia((prev) => [...prev, created]);
      router.refresh();
      toast.success(t("uploadSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tErrors("generic"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: FlashcardMediaItem) {
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/flashcards/media/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMedia((prev) => prev.filter((existing) => existing.id !== item.id));
      router.refresh();
    } catch {
      toast.error(tErrors("generic"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-2">
      {media.length > 0 ? (
        <div className="space-y-2">
          {media.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
              <MediaPreviewTile mediaType={item.media_type} url={item.url} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto shrink-0"
                onClick={() => handleDelete(item)}
                disabled={deletingId === item.id}
                aria-label={t("remove")}
              >
                {deletingId === item.id ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-3.5" aria-hidden="true" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*"
        onChange={handleFileSelected}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="size-3.5" aria-hidden="true" />
        )}
        {t("addMedia")}
      </Button>
    </div>
  );
}
