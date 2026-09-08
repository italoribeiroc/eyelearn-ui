"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_SOURCE_DOCUMENT_SIZE_BYTES,
  MAX_SOURCE_DOCUMENTS_PER_REQUEST,
  SOURCE_DOCUMENT_ACCEPT,
  inferSourceDocumentContentType,
} from "@/lib/flashcards/source-document-constraints";
import type { GenerationSourceDocumentDetail } from "@/lib/api/types";

type DocumentEntry =
  // The PUT to the bucket, tracked with real progress via XHR (see uploadOne).
  | { status: "uploading"; localId: string; filename: string; progress: number }
  // The PUT finished; the server is now downloading and extracting/transcribing
  // it (no progress to report for this step, it's one request/response).
  | { status: "processing"; localId: string; filename: string }
  | { status: "ready"; localId: string; document: GenerationSourceDocumentDetail }
  | { status: "error"; localId: string; filename: string; message: string };

function isReady(entry: DocumentEntry): entry is DocumentEntry & { status: "ready" } {
  return entry.status === "ready";
}

/** PUTs `file` to a presigned URL via XMLHttpRequest (not fetch, which has
 * no cross-browser upload-progress event) so the caller can render a real
 * progress bar instead of an indeterminate spinner for this step. `signal`
 * lets the caller cancel mid-upload (see handleCancel) -- XHR predates
 * AbortSignal support, so it's wired up manually via xhr.abort(). */
function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
}

/**
 * Upload flow mirrors MediaAttachmentField: presigned PUT direct to the
 * bucket, then a confirm call -- except confirm here also runs server-side
 * text extraction (see flashcards/document_extraction.py) and the raw file
 * is deleted immediately after, so "ready" means "text extracted", not just
 * "uploaded". Multiple files, each tracked as its own uploading -> processing
 * -> ready chip, capped at MAX_SOURCE_DOCUMENTS_PER_REQUEST -- used from
 * AiGenerateDialog, which has no draft/flashcard id yet, so documents upload
 * directly against the collection and are linked to a draft only once
 * generation actually runs.
 *
 * A ready chip is clickable: it opens the actual extracted/transcribed text
 * in a bottom sheet so the uploader can verify (and fix) it before it's fed
 * into a generation prompt -- most useful for a photo or scanned page, since
 * the vision fallback that reads those can occasionally misread something,
 * but available for every document type for consistency.
 */
export function SourceDocumentAttachmentField({
  collectionId,
  onChange,
  onPendingChange,
}: {
  collectionId: number;
  onChange: (documentIds: number[]) => void;
  /** Fires whenever at least one file is still uploading or being read on
   * the server, so the caller (AiGenerateDialog) can block submission until
   * every attached document has actually finished -- otherwise a document
   * that hasn't finished processing yet would silently generate without it. */
  onPendingChange?: (pending: boolean) => void;
}) {
  const t = useTranslations("flashcards.sourceDocuments");
  const tCommon = useTranslations("flashcards.common");
  const tCardForm = useTranslations("flashcards.cardForm");
  const tErrors = useTranslations("auth.errors");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<DocumentEntry[]>([]);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  // Not state: aborting doesn't need to trigger a re-render by itself, only
  // the entries update that follows it does.
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const readyCount = entries.filter(isReady).length;
  const atLimit = readyCount >= MAX_SOURCE_DOCUMENTS_PER_REQUEST;
  const editingEntry = entries.find((entry) => entry.localId === editingLocalId);
  const editingDocument = editingEntry && isReady(editingEntry) ? editingEntry.document : null;

  // Reports the ready document ids, and whether anything is still
  // uploading/processing, up to the parent whenever entries change.
  // Deliberately an effect, not a call inlined into the setEntries updaters
  // below: an updater function must stay pure (no side effects), and
  // calling the parent's setState from inside one triggers React's "Cannot
  // update a component while rendering a different component" warning.
  useEffect(() => {
    onChange(entries.filter(isReady).map((entry) => entry.document.id));
    onPendingChange?.(entries.some((entry) => entry.status === "uploading" || entry.status === "processing"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = MAX_SOURCE_DOCUMENTS_PER_REQUEST - readyCount;
    if (room <= 0) {
      toast.error(t("tooManyDocuments", { max: MAX_SOURCE_DOCUMENTS_PER_REQUEST }));
      return;
    }
    const toUpload = files.slice(0, room);
    if (files.length > toUpload.length) {
      toast.info(t("tooManyDocuments", { max: MAX_SOURCE_DOCUMENTS_PER_REQUEST }));
    }

    for (const file of toUpload) {
      await uploadOne(file);
    }
  }

  async function uploadOne(file: File) {
    const localId = `${file.name}-${Date.now()}-${Math.random()}`;
    const contentType = inferSourceDocumentContentType(file);

    if (!contentType) {
      setEntries((prev) => [...prev, { status: "error", localId, filename: file.name, message: t("unsupportedType") }]);
      return;
    }
    if (file.size > MAX_SOURCE_DOCUMENT_SIZE_BYTES[contentType]) {
      setEntries((prev) => [...prev, { status: "error", localId, filename: file.name, message: t("fileTooLarge") }]);
      return;
    }

    const controller = new AbortController();
    abortControllersRef.current.set(localId, controller);
    setEntries((prev) => [...prev, { status: "uploading", localId, filename: file.name, progress: 0 }]);

    try {
      const urlRes = await fetch(`/api/flashcards/collections/${collectionId}/source-documents/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: contentType, filename: file.name, size_bytes: file.size }),
        signal: controller.signal,
      });
      if (!urlRes.ok) {
        const body = (await urlRes.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? tErrors("generic"));
      }
      const { storage_key, upload_url } = (await urlRes.json()) as { storage_key: string; upload_url: string };

      await putWithProgress(
        upload_url,
        file,
        contentType,
        (percent) => {
          setEntries((prev) =>
            prev.map((entry): DocumentEntry =>
              entry.localId === localId && entry.status === "uploading" ? { ...entry, progress: percent } : entry,
            ),
          );
        },
        controller.signal,
      );

      setEntries((prev) =>
        prev.map((entry): DocumentEntry =>
          entry.localId === localId ? { status: "processing", localId, filename: file.name } : entry,
        ),
      );

      const confirmRes = await fetch(`/api/flashcards/collections/${collectionId}/source-documents/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storage_key, content_type: contentType, filename: file.name, size_bytes: file.size }),
        signal: controller.signal,
      });
      if (!confirmRes.ok) {
        const body = (await confirmRes.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? t("extractionFailed"));
      }
      const document = (await confirmRes.json()) as GenerationSourceDocumentDetail;

      setEntries((prev) =>
        prev.map((entry): DocumentEntry =>
          entry.localId === localId ? { status: "ready", localId, document } : entry,
        ),
      );
    } catch (error) {
      // Cancelled via handleCancel: that already removed the entry, so
      // there's nothing left to show an error on.
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : tErrors("generic");
      setEntries((prev) =>
        prev.map((entry): DocumentEntry =>
          entry.localId === localId ? { status: "error", localId, filename: file.name, message } : entry,
        ),
      );
    } finally {
      abortControllersRef.current.delete(localId);
    }
  }

  /** Stops an in-progress upload or server-side read. There's no way to
   * interrupt Django mid-extraction once the confirm request has actually
   * reached it, so "cancel" here means "stop waiting for it and let the
   * user move on" -- if the server request still completes in the
   * background, it just creates a document row the user never sees or
   * uses, cleaned up later by the cleanup_stale_source_documents command. */
  function handleCancel(entry: DocumentEntry) {
    abortControllersRef.current.get(entry.localId)?.abort();
    setEntries((prev) => prev.filter((existing) => existing.localId !== entry.localId));
  }

  async function handleRemove(entry: DocumentEntry) {
    if (entry.status === "ready") {
      try {
        await fetch(`/api/flashcards/source-documents/${entry.document.id}`, { method: "DELETE" });
      } catch {
        // Best-effort -- still drop it locally below even if the delete call fails.
      }
    }
    setEntries((prev) => prev.filter((existing) => existing.localId !== entry.localId));
  }

  function openEditor(entry: DocumentEntry & { status: "ready" }) {
    setEditingLocalId(entry.localId);
    setEditText(entry.document.extracted_text);
  }

  function closeEditor() {
    if (savingEdit) return; // don't let it close mid-save
    setEditingLocalId(null);
  }

  async function handleSaveEdit() {
    if (!editingEntry || !isReady(editingEntry) || savingEdit) return;
    const documentId = editingEntry.document.id;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/flashcards/source-documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracted_text: editText }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as GenerationSourceDocumentDetail;

      setEntries((prev) =>
        prev.map((entry): DocumentEntry =>
          entry.localId === editingEntry.localId ? { status: "ready", localId: entry.localId, document: updated } : entry,
        ),
      );
      toast.success(t("editTextSuccess"));
      setEditingLocalId(null);
    } catch {
      toast.error(tErrors("generic"));
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      {entries.length > 0 ? (
        <div className="min-w-0 space-y-2">
          {entries.map((entry) => (
            <div key={entry.localId} className="min-w-0 rounded-lg border border-border p-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  {entry.status === "ready" ? (
                    <button
                      type="button"
                      onClick={() => openEditor(entry)}
                      className="block w-full truncate text-left text-foreground hover:underline"
                      title={`${entry.document.filename} - ${t("viewTextHint")}`}
                    >
                      {entry.document.filename} · {t("charCountLabel", { count: entry.document.char_count })}
                    </button>
                  ) : entry.status === "uploading" ? (
                    <p className="truncate text-foreground-muted" title={entry.filename}>
                      {entry.filename} - {t("uploading", { percent: entry.progress })}
                    </p>
                  ) : entry.status === "processing" ? (
                    <p className="truncate text-foreground-muted" title={entry.filename}>
                      {entry.filename} - {t("processing")}
                    </p>
                  ) : (
                    <p className="truncate text-error" title={entry.filename}>
                      {entry.filename}: {entry.message}
                    </p>
                  )}
                </div>
                {entry.status === "uploading" || entry.status === "processing" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="group shrink-0"
                    onClick={() => handleCancel(entry)}
                    aria-label={tCommon("cancel")}
                    title={tCommon("cancel")}
                  >
                    <Loader2
                      className="size-3.5 animate-spin text-foreground-muted group-hover:hidden"
                      aria-hidden="true"
                    />
                    <X className="hidden size-3.5 group-hover:block" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={() => handleRemove(entry)}
                    aria-label={t("remove")}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                )}
              </div>
              {entry.status === "uploading" ? (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand-turquoise transition-[width]"
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SOURCE_DOCUMENT_ACCEPT}
        onChange={handleFilesSelected}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={atLimit}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="size-3.5" aria-hidden="true" />
        {t("addDocument")}
      </Button>

      <Sheet open={editingDocument !== null} onOpenChange={(next) => !next && closeEditor()}>
        <SheetContent side="bottom" showCloseButton={!savingEdit} className="flex max-h-[85vh] flex-col">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
            <SheetHeader className="pr-10">
              <SheetTitle>{t("extractedTextTitle")}</SheetTitle>
              <SheetDescription>{t("extractedTextDescription")}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <p className="truncate text-xs font-medium text-foreground-muted">{editingDocument?.filename}</p>
              <Textarea
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                rows={12}
                disabled={savingEdit}
                autoFocus
                className="font-mono text-xs"
              />
              <p className="text-right text-xs text-foreground-muted">
                {t("charCountLabel", { count: editText.length })}
              </p>
            </div>
            <div
              className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={closeEditor}
                disabled={savingEdit}
                className="w-full sm:w-auto"
              >
                {tCommon("cancel")}
              </Button>
              <Button type="button" onClick={handleSaveEdit} disabled={savingEdit} className="w-full sm:w-auto">
                {savingEdit ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {tCardForm("save")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
