"use client";

import { useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaAttachmentField } from "@/components/flashcards/media-attachment-field";
import { StagedMediaField, type StagedMedia } from "@/components/flashcards/staged-media-field";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type {
  ApiFieldErrors,
  CardType,
  Flashcard,
  FlashcardOption,
  MediaSide,
} from "@/lib/api/types";

const CARD_TYPES: CardType[] = ["basic", "multiple_choice", "typed_answer"];

function emptyOptions(): FlashcardOption[] {
  return [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
  ];
}

/** Create a new flashcard in `collectionId`, or edit an existing `flashcard`. */
export function FlashcardFormDialog({
  mode,
  collectionId,
  flashcard,
  trigger,
}: {
  mode: "create" | "edit";
  collectionId: number;
  flashcard?: Flashcard;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("flashcards.cardForm");
  const tTypes = useTranslations("flashcards.cardType");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [cardType, setCardType] = useState<CardType>(flashcard?.card_type ?? "basic");
  const [prompt, setPrompt] = useState(flashcard?.prompt ?? "");
  const [answer, setAnswer] = useState(flashcard?.answer ?? "");
  const [options, setOptions] = useState<FlashcardOption[]>(
    flashcard?.card_type === "multiple_choice" && flashcard.options.length
      ? flashcard.options
      : emptyOptions(),
  );
  const [acceptedAnswers, setAcceptedAnswers] = useState(
    flashcard?.accepted_answers?.join(", ") ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);
  const [stagedPromptFiles, setStagedPromptFiles] = useState<StagedMedia[]>([]);
  const [stagedAnswerFiles, setStagedAnswerFiles] = useState<StagedMedia[]>([]);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  function clearStagedFiles() {
    for (const staged of [...stagedPromptFiles, ...stagedAnswerFiles]) {
      URL.revokeObjectURL(staged.previewUrl);
    }
    setStagedPromptFiles([]);
    setStagedAnswerFiles([]);
  }

  function resetFields() {
    setPrompt("");
    setAnswer("");
    setOptions(emptyOptions());
    setAcceptedAnswers("");
    clearStagedFiles();
  }

  function resetAndClose(next: boolean) {
    setOpen(next);
    if (!next) {
      setCardType(flashcard?.card_type ?? "basic");
      setPrompt(flashcard?.prompt ?? "");
      setAnswer(flashcard?.answer ?? "");
      setOptions(
        flashcard?.card_type === "multiple_choice" && flashcard.options.length
          ? flashcard.options
          : emptyOptions(),
      );
      setAcceptedAnswers(flashcard?.accepted_answers?.join(", ") ?? "");
      setError(null);
      setCreatedCount(0);
      clearStagedFiles();
    }
  }

  /** Uploads one staged file to a just-created flashcard; returns whether it succeeded. */
  async function uploadStagedFile(flashcardId: number, side: MediaSide, staged: StagedMedia): Promise<boolean> {
    try {
      const urlRes = await fetch(`/api/flashcards/cards/${flashcardId}/media/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: staged.mediaType,
          side,
          content_type: staged.file.type,
          filename: staged.file.name,
          size_bytes: staged.file.size,
        }),
      });
      if (!urlRes.ok) return false;
      const { storage_key, upload_url } = (await urlRes.json()) as {
        storage_key: string;
        upload_url: string;
      };

      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": staged.file.type },
        body: staged.file,
      });
      if (!putRes.ok) return false;

      const confirmRes = await fetch(`/api/flashcards/cards/${flashcardId}/media/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_key,
          media_type: staged.mediaType,
          side,
          content_type: staged.file.type,
          size_bytes: staged.file.size,
        }),
      });
      return confirmRes.ok;
    } catch {
      return false;
    }
  }

  function updateOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? { ...option, text } : option)));
  }

  function setCorrectOption(index: number) {
    setOptions((prev) => prev.map((option, i) => ({ ...option, is_correct: i === index })));
  }

  function addOption() {
    setOptions((prev) => [...prev, { text: "", is_correct: false }]);
  }

  function removeOption(index: number) {
    setOptions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((option) => option.is_correct) && next.length) {
        next[0] = { ...next[0], is_correct: true };
      }
      return next;
    });
  }

  async function saveCard(keepOpen: boolean) {
    if (!prompt.trim()) return;

    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = { card_type: cardType, prompt: prompt.trim() };
    if (cardType === "basic") {
      payload.answer = answer.trim();
    } else if (cardType === "multiple_choice") {
      payload.options = options
        .filter((option) => option.text.trim())
        .map((option) => ({ text: option.text.trim(), is_correct: option.is_correct }));
    } else {
      payload.answer = answer.trim();
      payload.accepted_answers = acceptedAnswers
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    try {
      const endpoint =
        mode === "create"
          ? `/api/flashcards/collections/${collectionId}/flashcards`
          : `/api/flashcards/cards/${flashcard!.id}`;

      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedCard = (await res.json()) as Flashcard;

        if (mode === "create" && (stagedPromptFiles.length > 0 || stagedAnswerFiles.length > 0)) {
          const results = await Promise.all([
            ...stagedPromptFiles.map((staged) => uploadStagedFile(savedCard.id, "prompt", staged)),
            ...stagedAnswerFiles.map((staged) => uploadStagedFile(savedCard.id, "answer", staged)),
          ]);
          const failedCount = results.filter((ok) => !ok).length;
          if (failedCount > 0) {
            toast.warning(t("mediaUploadPartialFailure", { count: failedCount }));
          }
        }

        if (keepOpen) {
          setCreatedCount((count) => count + 1);
          resetFields();
          router.refresh();
          promptRef.current?.focus();
        } else {
          toast.success(mode === "create" ? t("createSuccess") : t("updateSuccess"));
          setOpen(false);
          router.refresh();
        }
        return;
      }

      const body = (await res.json().catch(() => null)) as ApiFieldErrors | null;
      const firstFieldError = body
        ? Object.values(body).find((value): value is string[] => Array.isArray(value) && value.length > 0)
        : undefined;
      setError(firstFieldError?.[0] ?? body?.detail ?? tErrors("generic"));
    } catch {
      setError(tErrors("network"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    saveCard(false);
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("createTitle") : t("editTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-1" noValidate>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="card-type">{t("typeLabel")}</Label>
            <select
              id="card-type"
              value={cardType}
              onChange={(event) => setCardType(event.target.value as CardType)}
              disabled={mode === "edit"}
              className={cn(
                "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30",
              )}
            >
              {CARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tTypes(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="card-prompt">{t("promptLabel")}</Label>
            <Textarea
              id="card-prompt"
              ref={promptRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              required
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("promptMediaLabel")}</Label>
            {mode === "edit" ? (
              <MediaAttachmentField
                flashcardId={flashcard!.id}
                side="prompt"
                initialMedia={flashcard!.media}
              />
            ) : (
              <StagedMediaField files={stagedPromptFiles} onFilesChange={setStagedPromptFiles} />
            )}
          </div>

          {cardType === "basic" ? (
            <div className="grid gap-2">
              <Label htmlFor="card-answer">{t("answerLabel")}</Label>
              <Textarea
                id="card-answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                rows={2}
              />
            </div>
          ) : null}

          {cardType === "typed_answer" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="card-answer">{t("canonicalAnswerLabel")}</Label>
                <Input
                  id="card-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="card-accepted">{t("acceptedAnswersLabel")}</Label>
                <Input
                  id="card-accepted"
                  value={acceptedAnswers}
                  onChange={(event) => setAcceptedAnswers(event.target.value)}
                  placeholder={t("acceptedAnswersPlaceholder")}
                />
              </div>
            </>
          ) : null}

          {cardType === "basic" || cardType === "typed_answer" ? (
            <div className="grid gap-2">
              <Label>{t("answerMediaLabel")}</Label>
              {mode === "edit" ? (
                <MediaAttachmentField
                  flashcardId={flashcard!.id}
                  side="answer"
                  initialMedia={flashcard!.media}
                />
              ) : (
                <StagedMediaField files={stagedAnswerFiles} onFilesChange={setStagedAnswerFiles} />
              )}
            </div>
          ) : null}

          {cardType === "multiple_choice" ? (
            <div className="grid gap-2">
              <Label>{t("optionsLabel")}</Label>
              <p className="text-xs text-foreground-muted">{t("optionsHint")}</p>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-option"
                      checked={option.is_correct}
                      onChange={() => setCorrectOption(index)}
                      aria-label={t("markCorrect")}
                      className="size-4 shrink-0 accent-brand-turquoise"
                    />
                    <Input
                      value={option.text}
                      onChange={(event) => updateOptionText(index, event.target.value)}
                      placeholder={t("optionPlaceholder", { number: index + 1 })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= 2}
                      aria-label={t("removeOption")}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addOption} className="self-start">
                <Plus className="size-3.5" aria-hidden="true" />
                {t("addOption")}
              </Button>
            </div>
          ) : null}

          <DialogFooter className="items-center sm:items-center">
            {createdCount > 0 ? (
              <p className="mr-auto text-xs text-foreground-muted">
                {t("createdCount", { count: createdCount })}
              </p>
            ) : null}
            {mode === "create" ? (
              <Button
                type="button"
                variant="outline"
                disabled={submitting || !prompt.trim()}
                onClick={() => saveCard(true)}
              >
                {t("saveAndAddAnother")}
              </Button>
            ) : null}
            <Button type="submit" disabled={submitting || !prompt.trim()}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {mode === "create" && createdCount > 0 ? t("done") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
