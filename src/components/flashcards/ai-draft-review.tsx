"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAiGeneration, useAiGenerationActions } from "@/context/ai-generation-context";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AiGenerationConfirmResult, AiGenerationDraft, AiGenerationDraftCard } from "@/lib/api/types";

const MAX_REGENERATE_INSTRUCTION_LENGTH = 1000; // matches MAX_REGENERATE_INSTRUCTION_LENGTH in flashcards/services.py
const MAX_REGENERATE_SELECTION = 10; // matches MAX_AI_REGENERATE_COUNT in flashcards/services.py
const PAGE_SIZE = 10;

function CardBody({ cardType, card }: { cardType: AiGenerationDraft["card_type"]; card: AiGenerationDraftCard }) {
  const tCardForm = useTranslations("flashcards.cardForm");

  if (cardType === "multiple_choice") {
    return (
      <div className="mt-3 space-y-1.5">
        {card.options.map((option, index) => (
          <div
            key={index}
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              option.is_correct
                ? "border-success bg-success/10 text-success"
                : "border-border bg-surface-muted text-foreground-muted",
            )}
          >
            {option.text}
          </div>
        ))}
      </div>
    );
  }

  if (cardType === "typed_answer") {
    return (
      <div className="mt-3 space-y-1.5">
        <p className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground">
          {card.answer}
        </p>
        {card.accepted_answers.length > 0 ? (
          <p className="text-xs text-foreground-muted">
            {tCardForm("acceptedAnswersLabel")}: {card.accepted_answers.join(", ")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <p className="mt-3 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground">
      {card.answer}
    </p>
  );
}

export function AiDraftReview({
  collectionId,
  initialDraft,
}: {
  collectionId: number;
  initialDraft: AiGenerationDraft;
}) {
  const t = useTranslations("flashcards.aiGenerate");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const { startGeneration } = useAiGenerationActions();
  const generation = useAiGeneration(initialDraft.id);

  const [cards, setCards] = useState(initialDraft.cards);
  // Tracks the last provider `cards` array this component has absorbed, so
  // the render-time sync below (an idiomatic React alternative to an
  // effect-triggered setState -- see "Adjusting state when a prop changes"
  // in the React docs) only fires once per new batch, not every render.
  const [syncedGenerationCards, setSyncedGenerationCards] = useState<AiGenerationDraftCard[] | null>(null);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [instruction, setInstruction] = useState("");
  const [regenerateSheetOpen, setRegenerateSheetOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<number>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collectionHref = `/flashcards/${collectionId}`;
  const busy = regenerating || saving || discarding;
  const continuing = generation !== null;
  const isIncomplete = cards.length < initialDraft.target_count;
  const totalPages = Math.max(Math.ceil(cards.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages - 1);
  const visibleCards = cards.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const allSelected = cards.length > 0 && selectedIds.size === cards.length;
  // Disabled once nothing would change: at the cap with the draft not fully selected yet.
  const selectAllDisabled = busy || (!allSelected && selectedIds.size >= MAX_REGENERATE_SELECTION);

  // Generation continues in the background regardless of whether this page
  // stays mounted -- the actual polling loop lives in AiGenerationProvider
  // (mounted once above every (app) page), started here idempotently in
  // case it isn't already running (e.g. this page was loaded directly, or
  // refreshed, rather than reached via the dialog that already started it).
  useEffect(() => {
    startGeneration(initialDraft);
    // Runs once per draft on mount -- initialDraft is a stable server-fetched prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft.id]);

  // Mirrors this draft's live cards from the provider as each batch lands,
  // even though this component itself no longer runs the polling loop.
  // Setting state during render (rather than in an effect) is the pattern
  // React recommends for "adjusting state when a prop changes": it avoids
  // an extra render pass, and updated_cards is always the authoritative
  // current list from the server (see generate_next_batch's locked splice),
  // so it's safe to adopt wholesale even over local optimistic edits.
  if (generation && generation.cards !== syncedGenerationCards) {
    setSyncedGenerationCards(generation.cards);
    setCards(generation.cards);
  }

  if (initialDraft.status !== "pending") {
    return (
      <Alert>
        <AlertDescription>
          {initialDraft.status === "confirmed" ? t("alreadyConfirmed") : t("alreadyDiscarded")}
        </AlertDescription>
      </Alert>
    );
  }

  function toggleSelected(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const card of cards) {
        if (next.size >= MAX_REGENERATE_SELECTION) break;
        next.add(card.id);
      }
      return next;
    });
    if (cards.length > MAX_REGENERATE_SELECTION) {
      toast.info(t("regenerateSelectionCapped", { max: MAX_REGENERATE_SELECTION }));
    }
  }

  async function handleRemove(id: number) {
    setError(null);
    setRemovingIds((prev) => new Set(prev).add(id));

    try {
      const res = await fetch(`/api/flashcards/ai-generate/${initialDraft.id}/remove-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_ids: [id] }),
      });

      if (res.ok) {
        setCards((prev) => prev.filter((card) => card.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        setError(tErrors("generic"));
      }
    } catch {
      setError(tErrors("network"));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleRegenerate() {
    if (selectedIds.size === 0 || !instruction.trim() || regenerating) return;

    setRegenerating(true);
    setRegeneratingIds(new Set(selectedIds));
    setError(null);

    try {
      const res = await fetch(`/api/flashcards/ai-generate/${initialDraft.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_ids: Array.from(selectedIds), instruction: instruction.trim() }),
      });

      if (res.ok) {
        const updated = (await res.json()) as AiGenerationDraft;
        const byId = new Map(updated.cards.map((card) => [card.id, card]));
        setCards((prev) => prev.map((card) => byId.get(card.id) ?? card));
        setSelectedIds(new Set());
        setInstruction("");
        setRegenerateSheetOpen(false);
      } else if (res.status === 502) {
        setError(t("errorGenerationFailed"));
      } else {
        setError(tErrors("generic"));
      }
    } catch {
      setError(tErrors("network"));
    } finally {
      setRegenerating(false);
      setRegeneratingIds(new Set());
    }
  }

  function handleRetryContinue() {
    startGeneration({ ...initialDraft, cards, status: "pending" });
  }

  async function handleSave() {
    if (saving || cards.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/flashcards/ai-generate/${initialDraft.id}/confirm`, { method: "POST" });

      if (res.ok) {
        const result = (await res.json()) as AiGenerationConfirmResult;
        if (result.errors.length > 0) {
          toast.warning(t("confirmPartialFailure", { count: result.errors.length }));
        } else {
          toast.success(t("confirmSuccess", { count: result.created.length }));
        }
        router.push(collectionHref);
        router.refresh();
        return;
      }

      setError(tErrors("generic"));
    } catch {
      setError(tErrors("network"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscard() {
    if (discarding) return;

    setDiscarding(true);
    setError(null);

    try {
      await fetch(`/api/flashcards/ai-generate/${initialDraft.id}/discard`, { method: "POST" });
    } catch {
      // Best-effort -- even if this fails, there's nothing to lose by just navigating away
      // from a draft the user no longer wants; a stale pending row is harmless.
    } finally {
      router.push(collectionHref);
    }
  }

  return (
    <div className={cn("space-y-4", selectedIds.size > 0 ? "pb-44 sm:pb-32" : "pb-28 sm:pb-24")}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isIncomplete ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-accent/30 bg-brand-accent/10 p-4">
          <p className="flex items-center gap-2 text-sm text-foreground">
            {continuing ? (
              <Sparkles className="size-4 shrink-0 animate-pulse text-brand-accent" aria-hidden="true" />
            ) : null}
            {t("generationIncomplete", { done: cards.length, total: initialDraft.target_count })}
          </p>
          {continuing ? (
            <span className="flex items-center gap-2 text-sm text-foreground-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("generatingInBackground")}
            </span>
          ) : (
            <Button type="button" size="sm" onClick={handleRetryContinue} disabled={busy}>
              {t("continueGeneratingButton")}
            </Button>
          )}
        </div>
      ) : null}

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-foreground-muted">
          {t("emptyStateHint")}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-foreground-muted">
              {t("regenerateSelectionLimitHint", { max: MAX_REGENERATE_SELECTION })}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              disabled={selectAllDisabled}
            >
              {allSelected ? t("deselectAll") : t("selectAll")}
            </Button>
          </div>

          <div className="space-y-3">
            {visibleCards.map((card) => {
              const isRegeneratingCard = regeneratingIds.has(card.id);
              const isRemoving = removingIds.has(card.id);
              const isSelected = selectedIds.has(card.id);
              const selectionCapped = !isSelected && selectedIds.size >= MAX_REGENERATE_SELECTION;
              return (
                <div
                  key={card.id}
                  className={cn(
                    "rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-soft)] transition-opacity",
                    (isRegeneratingCard || isRemoving) && "opacity-50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => toggleSelected(card.id, checked === true)}
                      disabled={busy || selectionCapped}
                      aria-label={t("selectForRegenerate")}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-base font-semibold text-foreground">{card.prompt}</p>
                      <CardBody cardType={initialDraft.card_type} card={card} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(card.id)}
                      disabled={busy || isRemoving}
                      aria-label={t("removeCard")}
                    >
                      {isRemoving ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 text-sm text-foreground-muted">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                {t("previousPage")}
              </Button>
              <span className="flex flex-col items-center leading-tight">
                <span>{t("pageIndicator", { current: currentPage + 1, total: totalPages })}</span>
                <span className="text-xs">
                  {t("pageRangeIndicator", {
                    from: currentPage * PAGE_SIZE + 1,
                    to: Math.min((currentPage + 1) * PAGE_SIZE, cards.length),
                    count: cards.length,
                  })}
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={currentPage >= totalPages - 1}
              >
                {t("nextPage")}
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </>
      )}

      {/* Material-style persistent bottom app bar: truly fixed to the
          viewport (not sticky-in-flow), so Discard/Save are always reachable
          without scrolling through what could be hundreds of generated
          cards, and without leaving a gap once the page content ends. The
          root wrapper's padding-bottom reserves space so the last card is
          never hidden underneath it. Selecting cards surfaces a "Regenerate
          selected" trigger here, right next to the actions -- clicking it
          opens the bottom sheet below with a properly sized instruction
          field, instead of squeezing a textarea into this compact bar.
          Below sm, the two groups stack as full-width rows instead of
          wrapping into a left-aligned row over a right-aligned one, and
          Discard/Save become an even 2-up grid for bigger, easier-to-tap
          mobile targets. env(safe-area-inset-bottom) keeps it clear of the
          home indicator on notched phones. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 shadow-[var(--shadow-soft-lg)] backdrop-blur-md">
        <div
          className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {selectedIds.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {t("regenerateSelectedLabel", { count: selectedIds.size })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                disabled={regenerating}
              >
                {t("clearSelection")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRegenerateSheetOpen(true)}
                disabled={busy}
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                {t("regenerateButton")}
              </Button>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:justify-end">
            <Button type="button" variant="ghost" onClick={handleDiscard} disabled={busy} className="w-full sm:w-auto">
              {discarding ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {t("discardButton")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={busy || cards.length === 0}
              className="w-full sm:w-auto"
            >
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {t("saveButton")}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom sheet for the regenerate instruction: full-width and tall
          enough to write in comfortably, opened from the compact bar above
          rather than living permanently inside it. Actions stack as
          full-width rows below sm (bigger touch targets, no cramped
          side-by-side buttons on a narrow screen) and the content area
          scrolls independently of the header so a short viewport (e.g. with
          the on-screen keyboard open) never clips the actions off-screen. */}
      <Sheet
        open={regenerateSheetOpen}
        onOpenChange={(next) => {
          if (regenerating) return; // don't let it close mid-request
          setRegenerateSheetOpen(next);
        }}
      >
        <SheetContent side="bottom" showCloseButton={!regenerating} className="flex max-h-[85vh] flex-col">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
            <SheetHeader className="pr-10">
              <SheetTitle>{t("regenerateSelectedLabel", { count: selectedIds.size })}</SheetTitle>
              <SheetDescription>{t("regenerateSheetDescription")}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Textarea
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                placeholder={t("regenerateInstructionPlaceholder")}
                rows={5}
                maxLength={MAX_REGENERATE_INSTRUCTION_LENGTH}
                disabled={regenerating}
                autoFocus
              />
              <p className="text-right text-xs text-foreground-muted">
                {instruction.length}/{MAX_REGENERATE_INSTRUCTION_LENGTH}
              </p>
            </div>
            <div
              className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRegenerateSheetOpen(false)}
                disabled={regenerating}
                className="w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating || !instruction.trim()}
                className="w-full sm:w-auto"
              >
                {regenerating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {regenerating ? t("regenerating") : t("regenerateButton")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
