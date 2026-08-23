"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

type ImportSummary = {
  created: number;
  skipped: number;
  errors: string[];
};

export function ImportExportMenu({ collectionId }: { collectionId: number }) {
  const t = useTranslations("flashcards.importExport");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
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

      const summary = (await res.json()) as ImportSummary;
      router.refresh();

      if (summary.created > 0 && summary.skipped === 0) {
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
    }
  }

  return (
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
  );
}
