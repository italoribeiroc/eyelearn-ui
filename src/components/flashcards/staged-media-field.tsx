"use client";

import { useRef } from "react";
import { Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MediaPreviewTile } from "@/components/flashcards/media-preview-tile";
import { ALLOWED_CONTENT_TYPES, MAX_SIZE_BYTES, inferMediaType } from "@/lib/flashcards/media-constraints";
import type { MediaType } from "@/lib/api/types";

export type StagedMedia = {
  file: File;
  mediaType: MediaType;
  previewUrl: string;
};

/**
 * Create-mode counterpart to MediaAttachmentField: the flashcard doesn't
 * exist yet, so files are only picked and previewed locally (via an object
 * URL) here. FlashcardFormDialog uploads them for real once the card is
 * saved and has an id.
 */
export function StagedMediaField({
  files,
  onFilesChange,
}: {
  files: StagedMedia[];
  onFilesChange: (files: StagedMedia[]) => void;
}) {
  const t = useTranslations("flashcards.media");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
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

    onFilesChange([...files, { file, mediaType, previewUrl: URL.createObjectURL(file) }]);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(files[index].previewUrl);
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((staged, index) => (
            <div key={staged.previewUrl} className="flex items-center gap-2 rounded-lg border border-border p-2">
              <MediaPreviewTile mediaType={staged.mediaType} url={staged.previewUrl} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto shrink-0"
                onClick={() => removeFile(index)}
                aria-label={t("remove")}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
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
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="size-3.5" aria-hidden="true" />
        {t("addMedia")}
      </Button>
    </div>
  );
}
