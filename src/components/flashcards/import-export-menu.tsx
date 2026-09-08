"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { batchImportRows, parseDelimitedImport, type ImportRow } from "@/lib/flashcards/import";
import type { ImportSummary } from "@/app/api/flashcards/collections/[id]/import/route";

function mergeSummaries(target: ImportSummary, addition: ImportSummary) {
  target.created += addition.created;
  target.skipped += addition.skipped;
  target.limitReached = target.limitReached || addition.limitReached;
  for (const error of addition.errors) {
    if (target.errors.length >= 20) break;
    target.errors.push(error);
  }
}

/**
 * Parses the whole file client-side (never uploaded raw -- see apkg.ts's
 * docstring), then POSTs the extracted rows to the import route in batches
 * (see MAX_IMPORT_BATCH_SIZE) so a large deck's actual file size never
 * matters: only the much smaller extracted text crosses the network, a
 * batch at a time. Each batch request itself creates its whole batch via
 * one Django bulk-create call (see flashcard_bulk_create), not one request
 * per card, so even a deck of thousands of notes stays well under Django's
 * per-user rate limit. Progress is reported per batch (not per card --
 * a batch's own bulk-create call finishes as a single unit); a free-plan
 * cap hit in any batch stops the whole import, matching the single-request
 * behavior this replaced.
 */
async function runImport(
  collectionId: number,
  rows: ImportRow[],
  onProgress: (progress: { done: number; total: number }) => void,
): Promise<ImportSummary> {
  const batches = batchImportRows(rows);
  const overall: ImportSummary = { created: 0, skipped: 0, errors: [], limitReached: false };
  let doneBefore = 0;

  onProgress({ done: 0, total: rows.length });

  for (const batch of batches) {
    const res = await fetch(`/api/flashcards/collections/${collectionId}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: batch }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(body?.detail);
    }

    const batchSummary = (await res.json()) as ImportSummary;
    mergeSummaries(overall, batchSummary);
    doneBefore += batch.length;
    onProgress({ done: doneBefore, total: rows.length });

    if (overall.limitReached) break;
  }

  return overall;
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
      // Parsed entirely in this browser tab -- the raw file (which can be
      // tens of MB once a real Anki deck has embedded audio/images, even
      // though that media itself is never imported) never gets uploaded;
      // see runImport's docstring for why that's the point.
      let rows: ImportRow[];
      const summary: ImportSummary = { created: 0, skipped: 0, errors: [], limitReached: false };
      const filename = file.name.toLowerCase();

      if (filename.endsWith(".apkg")) {
        // Dynamic import: pulls in JSZip + sql.js only once a .apkg is
        // actually picked, instead of bundling them into every page that
        // renders this menu.
        const { parseApkg } = await import("@/lib/flashcards/apkg");
        const result = await parseApkg(await file.arrayBuffer());
        rows = result.rows;
        summary.skipped += result.skippedNotes;
        if (result.skippedNotes > 0) {
          summary.errors.push(
            `${result.skippedNotes} note(s) skipped (cloze deletions or note types with a single field aren't supported)`,
          );
        }
      } else {
        rows = parseDelimitedImport(await file.text());
      }

      const importResult = await runImport(collectionId, rows, setProgress);
      mergeSummaries(summary, importResult);
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
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : tErrors("network");
      toast.error(message);
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
