"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { ImportStreamEvent, ImportSummary } from "@/app/api/flashcards/collections/[id]/import/route";

/** Reads the import route's newline-delimited JSON stream, reporting each progress event. */
async function readImportStream(
  res: Response,
  onProgress: (progress: { done: number; total: number }) => void,
): Promise<ImportSummary> {
  if (!res.body) throw new Error("Response has no body to stream.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let summary: ImportSummary | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as ImportStreamEvent;
      if (event.type === "start") {
        onProgress({ done: 0, total: event.total });
      } else if (event.type === "progress") {
        onProgress({ done: event.done, total: event.total });
      } else if (event.type === "done") {
        summary = event.summary;
      }
    }
  }

  if (!summary) throw new Error("Import stream ended without a result.");
  return summary;
}

export function ImportExportMenu({ collectionId }: { collectionId: number }) {
  const t = useTranslations("flashcards.importExport");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setProgress(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/flashcards/collections/${collectionId}/import`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { detail?: string } | null;
        toast.error(body?.detail ?? tErrors("generic"));
        return;
      }

      const summary = await readImportStream(res, setProgress);
      router.refresh();

      if (summary.limitReached) {
        toast.error(t("importLimitReached", { created: summary.created }), {
          action: { label: t("upgradeCta"), onClick: () => router.push("/account") },
        });
      } else if (summary.created > 0 && summary.skipped === 0) {
        toast.success(t("importSuccess", { count: summary.created }));
      } else if (summary.created > 0) {
        toast.warning(t("importPartial", { created: summary.created, skipped: summary.skipped }), {
          description: summary.errors.slice(0, 3).join(" "),
        });
      } else {
        toast.error(t("importFailed"), { description: summary.errors.slice(0, 3).join(" ") });
      }
    } catch {
      toast.error(tErrors("network"));
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt,.apkg"
          onChange={handleFileSelected}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          {importing ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-3.5" aria-hidden="true" />
          )}
          {t("importButton")}
        </Button>
        <Button asChild type="button" variant="outline" size="sm">
          <a href={`/api/flashcards/collections/${collectionId}/export`}>
            <Download className="size-3.5" aria-hidden="true" />
            {t("exportButton")}
          </a>
        </Button>
      </div>

      {importing ? (
        <div className="max-w-xs space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={
                progress && progress.total > 0
                  ? "h-full rounded-full bg-brand-turquoise transition-all duration-200"
                  : "h-full w-1/3 animate-pulse rounded-full bg-brand-turquoise"
              }
              style={
                progress && progress.total > 0
                  ? { width: `${Math.round((progress.done / progress.total) * 100)}%` }
                  : undefined
              }
            />
          </div>
          <p className="text-xs text-foreground-muted">
            {progress && progress.total > 0
              ? t("importProgress", { done: Math.min(progress.done, progress.total), total: progress.total })
              : t("importPreparing")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
