import { Music, Video } from "lucide-react";
import type { MediaType } from "@/lib/api/types";

/** Compact preview used in the manage-attachments rows (both uploaded and still-staged media). */
export function MediaPreviewTile({ mediaType, url }: { mediaType: MediaType; url: string }) {
  if (mediaType === "image") {
    // eslint-disable-next-line @next/next/no-img-element -- presigned/blob URL, next/image can't handle either
    return <img src={url} alt="" className="size-14 shrink-0 rounded-md object-cover" />;
  }
  if (mediaType === "audio") {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Music className="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
        <audio src={url} controls className="h-8 min-w-0 flex-1" />
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Video className="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
      <video src={url} controls className="h-16 max-w-full rounded-md" />
    </div>
  );
}
