"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAiGenerationActions } from "@/context/ai-generation-context";
import { useRouter } from "@/i18n/navigation";
import type { AiGenerationDraft, ApiFieldErrors, CardType } from "@/lib/api/types";

const CARD_TYPES: CardType[] = ["basic", "multiple_choice", "typed_answer"];
const MAX_LEARNING_REQUEST_LENGTH = 2000; // matches MAX_LEARNING_REQUEST_LENGTH in flashcards/services.py
const MAX_COUNT = 500; // matches MAX_AI_GENERATE_COUNT in flashcards/services.py

// Cycled on the submit button while waiting -- this dialog only ever makes
// one request (the first batch, see below), so there's no real step-by-step
// progress to report yet; these just keep the wait from feeling frozen.
const GENERATING_PHRASE_KEYS = [
  "generatingPhaseThinking",
  "generatingPhaseDrafting",
  "generatingPhaseChecking",
  "generatingPhaseFinishing",
] as const;
const GENERATING_PHRASE_INTERVAL_MS = 1800;

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** Step 1 of AI flashcard generation: pick a type, how many cards (a manual
 * number, or Automatic to let the AI decide based on the topic), and
 * describe what to learn. Submitting makes exactly ONE request (creating the
 * draft with its first batch of cards) and redirects straight to the
 * dedicated review page -- if the requested count is larger than one AI call
 * can safely produce, the review page itself keeps generating the rest in
 * the background (see ai-draft-review.tsx) so the user isn't stuck watching
 * this dialog for a large generation. */
export function AiGenerateDialog({
  collectionId,
  trigger,
}: {
  collectionId: number;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("flashcards.aiGenerate");
  const tTypes = useTranslations("flashcards.cardType");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const { startGeneration } = useAiGenerationActions();

  const [open, setOpen] = useState(false);
  const [cardType, setCardType] = useState<CardType>("basic");
  const [countMode, setCountMode] = useState<"auto" | "custom">("auto");
  const [customCount, setCustomCount] = useState(10);
  const [learningRequest, setLearningRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (submitting) {
      intervalRef.current = setInterval(() => {
        setPhraseIndex((i) => (i + 1) % GENERATING_PHRASE_KEYS.length);
      }, GENERATING_PHRASE_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [submitting]);

  function onOpenChange(next: boolean) {
    if (submitting) return; // don't let the dialog close mid-request
    setOpen(next);
    if (!next) setError(null);
  }

  function errorMessageFor(status: number, body: ApiFieldErrors | null) {
    if (status === 402) return t("errorNotPro");
    if (status === 429) return tErrors("tooManyRequests");
    if (status === 502) return t("errorGenerationFailed");
    return body?.detail ?? tErrors("generic");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!learningRequest.trim() || submitting) return;

    setSubmitting(true);
    setPhraseIndex(0);
    setError(null);

    try {
      const res = await fetch(`/api/flashcards/collections/${collectionId}/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          countMode === "auto"
            ? { card_type: cardType, auto: true, learning_request: learningRequest.trim() }
            : { card_type: cardType, count: customCount, learning_request: learningRequest.trim() },
        ),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as ApiFieldErrors | null;
        setError(errorMessageFor(res.status, body));
        return;
      }

      const draft = (await res.json()) as AiGenerationDraft;
      // Start the background continuation loop immediately, before the
      // redirect -- it lives in a provider mounted above every (app) page,
      // so it keeps running (and the user can go do something else in the
      // app) whether or not they stay on the review page it lands on next.
      startGeneration(draft);
      setOpen(false);
      router.push(`/flashcards/${collectionId}/ai-generate/${draft.id}`);
    } catch {
      setError(tErrors("network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-1" noValidate>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <fieldset disabled={submitting} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ai-generate-card-type">{t("cardTypeLabel")}</Label>
              <select
                id="ai-generate-card-type"
                value={cardType}
                onChange={(event) => setCardType(event.target.value as CardType)}
                className={selectClass}
              >
                {CARD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {tTypes(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>{t("countLabel")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={countMode === "auto" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCountMode("auto")}
                  className="flex-1"
                >
                  {t("countAutoLabel")}
                </Button>
                <Button
                  type="button"
                  variant={countMode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCountMode("custom")}
                  className="flex-1"
                >
                  {t("countCustomLabel")}
                </Button>
              </div>
              {countMode === "auto" ? (
                <p className="text-xs text-foreground-muted">{t("countAutoHint")}</p>
              ) : (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_COUNT}
                  value={customCount}
                  onChange={(event) => setCustomCount(Number(event.target.value))}
                  aria-label={t("countCustomLabel")}
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ai-generate-request">{t("learningRequestLabel")}</Label>
              <Textarea
                id="ai-generate-request"
                value={learningRequest}
                onChange={(event) => setLearningRequest(event.target.value)}
                placeholder={t("learningRequestPlaceholder")}
                rows={4}
                maxLength={MAX_LEARNING_REQUEST_LENGTH}
                required
                autoFocus
              />
              <p className="text-right text-xs text-foreground-muted">
                {learningRequest.length}/{MAX_LEARNING_REQUEST_LENGTH}
              </p>
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="submit"
              disabled={submitting || !learningRequest.trim()}
              className="bg-gradient-to-r from-brand-turquoise to-brand-accent text-brand-turquoise-foreground border-transparent"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              {submitting ? t(GENERATING_PHRASE_KEYS[phraseIndex]) : t("generateButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
