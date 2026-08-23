import type { FlashcardMediaItem } from "@/lib/api/types";

/** Read-only rendering of attached media, e.g. during a study session. */
export function MediaDisplay({ items }: { items: FlashcardMediaItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => {
        if (item.media_type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element -- presigned URL expires, next/image caching would go stale
            <img
              key={item.id}
              src={item.url}
              alt=""
              className="max-h-56 max-w-full rounded-lg object-contain"
            />
          );
        }
        if (item.media_type === "audio") {
          return <audio key={item.id} src={item.url} controls className="w-full max-w-xs" />;
        }
        return (
          <video
            key={item.id}
            src={item.url}
            controls
            className="max-h-64 max-w-full rounded-lg"
          />
        );
      })}
    </div>
  );
}
