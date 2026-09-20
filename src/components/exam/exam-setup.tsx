"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SelectableFlashcardList } from "@/components/exam/selectable-flashcard-list";
import { CollectionCheckboxList } from "@/components/flashcards/collection-checkbox-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";
import {
  collectionFlashcardsRequest,
  createExamRequest,
  ExamRequestError,
} from "@/lib/flashcards/exam-client";
import { buildCollectionTree, flattenCollectionTree } from "@/lib/flashcards/tree";
import { cn } from "@/lib/utils";
import type { Collection, ExamCreatePayload, Flashcard } from "@/lib/api/types";

// Mirrors the backend's caps (flashcards/services.py) so the form can
// explain a limit before the server has to reject it.
const MAX_EXAM_CARDS = 200;
const MAX_EXAM_MINUTES = 300;
const COUNT_PRESETS = [10, 20, 50];
const TIME_PRESETS = [15, 30, 60, 90];

type Tab = "random" | "pick";

function clampInt(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.trunc(value), min), max);
}

export function ExamSetup({ collections }: { collections: Collection[] }) {
  const t = useTranslations("exam.setup");
  const tErrors = useTranslations("exam.errors");
  const router = useRouter();

  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<Tab>("random");
  // number = a specific count, "all" = the whole selection (still capped).
  const [count, setCount] = useState<number | "all">(20);
  // cardId -> its collection, so deselecting a collection can drop its cards.
  const [pickedCards, setPickedCards] = useState<Map<number, number>>(new Map());
  const [cardsByCollection, setCardsByCollection] = useState<Record<number, Flashcard[]>>({});
  const [failedCollections, setFailedCollections] = useState<Set<number>>(new Set());
  const inFlight = useRef<Set<number>>(new Set());

  const [timed, setTimed] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedCollections = useMemo(
    () => flattenCollectionTree(buildCollectionTree(collections)).map((row) => row.collection),
    [collections],
  );
  const collectionNames = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection.name])),
    [collections],
  );

  const poolSize = useMemo(
    () =>
      collections
        .filter((collection) => selectedCollections.has(collection.id))
        .reduce((total, collection) => total + collection.flashcard_count, 0),
    [collections, selectedCollections],
  );
  const maxCount = Math.min(poolSize, MAX_EXAM_CARDS);
  const effectiveCount = count === "all" ? maxCount : Math.min(count, maxCount);

  // Lazily load the cards of each selected collection for the picker, once.
  useEffect(() => {
    if (tab !== "pick") return;
    for (const id of selectedCollections) {
      if (cardsByCollection[id] || inFlight.current.has(id) || failedCollections.has(id)) continue;
      inFlight.current.add(id);
      collectionFlashcardsRequest(id)
        .then((cards) => setCardsByCollection((prev) => ({ ...prev, [id]: cards })))
        .catch(() => setFailedCollections((prev) => new Set(prev).add(id)))
        .finally(() => inFlight.current.delete(id));
    }
  }, [tab, selectedCollections, cardsByCollection, failedCollections]);

  const pickerCards = useMemo(
    () =>
      orderedCollections
        .filter((collection) => selectedCollections.has(collection.id))
        .flatMap((collection) => cardsByCollection[collection.id] ?? []),
    [orderedCollections, selectedCollections, cardsByCollection],
  );
  const pickerLoading =
    tab === "pick" &&
    Array.from(selectedCollections).some((id) => !cardsByCollection[id] && !failedCollections.has(id));
  const pickerFailed = tab === "pick" && Array.from(selectedCollections).some((id) => failedCollections.has(id));

  function changeCollections(next: Set<number>) {
    setSelectedCollections(next);
    // Cards of a collection that is no longer ticked can't stay selected.
    setPickedCards((prev) => {
      const kept = new Map(Array.from(prev).filter(([, collectionId]) => next.has(collectionId)));
      return kept.size === prev.size ? prev : kept;
    });
    setFailedCollections(new Set());
  }

  function togglePicked(card: Flashcard) {
    setPickedCards((prev) => {
      const next = new Map(prev);
      if (next.has(card.id)) next.delete(card.id);
      else if (next.size < MAX_EXAM_CARDS) next.set(card.id, card.collection);
      return next;
    });
  }

  function pickMany(cards: Flashcard[]) {
    setPickedCards((prev) => {
      const next = new Map(prev);
      for (const card of cards) {
        if (next.size >= MAX_EXAM_CARDS) break;
        next.set(card.id, card.collection);
      }
      return next;
    });
  }

  const timeLimit = timed ? clampInt(minutes || 1, 1, MAX_EXAM_MINUTES) : null;
  const questionCount = tab === "random" ? effectiveCount : pickedCards.size;
  const canStart = selectedCollections.size > 0 && questionCount > 0 && !starting;

  async function start() {
    setStarting(true);
    setError(null);
    const payload: ExamCreatePayload =
      tab === "random"
        ? {
            mode: "random",
            collection_ids: Array.from(selectedCollections),
            count: count === "all" ? null : effectiveCount,
            time_limit_minutes: timeLimit,
          }
        : { mode: "selected", card_ids: Array.from(pickedCards.keys()), time_limit_minutes: timeLimit };

    try {
      const exam = await createExamRequest(payload);
      router.push(`/exam/${exam.id}`);
    } catch (caught) {
      const code = caught instanceof ExamRequestError ? caught.code : null;
      const known = ["empty_pool", "too_many_cards", "too_many_in_progress", "invalid_time_limit"];
      const message = tErrors(code && known.includes(code) ? code : "generic");
      setError(message);
      toast.error(message);
      setStarting(false);
    }
  }

  if (collections.length === 0) {
    return <p className="text-sm text-foreground-muted">{t("noCollections")}</p>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">{t("collectionsHeading")}</h2>
        <CollectionCheckboxList
          collections={collections}
          selectedIds={selectedCollections}
          onChange={changeCollections}
          cascade
          cardCountLabel={(cardCount) => t("cardCount", { count: cardCount })}
        />
        <p className="text-sm text-foreground-muted">
          {selectedCollections.size === 0
            ? t("emptySelectionHint")
            : t("poolSummary", { collections: selectedCollections.size, cards: poolSize })}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">{t("cardsHeading")}</h2>
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList>
            <TabsTrigger value="random">{t("tabRandom")}</TabsTrigger>
            <TabsTrigger value="pick">{t("tabPick")}</TabsTrigger>
          </TabsList>

          <TabsContent value="random" className="space-y-3 pt-2">
            <p className="text-sm text-foreground-muted">{t("randomDescription")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="exam-count" className="sr-only">
                {t("countLabel")}
              </Label>
              <Input
                id="exam-count"
                type="number"
                inputMode="numeric"
                min={1}
                max={Math.max(maxCount, 1)}
                disabled={poolSize === 0}
                value={poolSize === 0 ? "" : effectiveCount}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  if (Number.isFinite(parsed) && parsed > 0) setCount(clampInt(parsed, 1, MAX_EXAM_CARDS));
                }}
                className="w-24"
              />
              {COUNT_PRESETS.filter((preset) => preset < maxCount).map((preset) => (
                <ChipButton key={preset} active={count === preset} onClick={() => setCount(preset)}>
                  {preset}
                </ChipButton>
              ))}
              <ChipButton
                active={count === "all"}
                disabled={poolSize === 0}
                onClick={() => setCount("all")}
              >
                {t("countAll")}
              </ChipButton>
            </div>
            {poolSize > MAX_EXAM_CARDS ? (
              <p className="text-xs text-foreground-muted">{t("capHint", { max: MAX_EXAM_CARDS })}</p>
            ) : null}
          </TabsContent>

          <TabsContent value="pick" className="space-y-3 pt-2">
            {selectedCollections.size === 0 ? (
              <p className="text-sm text-foreground-muted">{t("pickNeedsCollections")}</p>
            ) : pickerLoading && pickerCards.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-foreground-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("loadingCards")}
              </p>
            ) : (
              <>
                {pickerFailed ? (
                  <Alert variant="destructive">
                    <AlertDescription>{t("loadCardsFailed")}</AlertDescription>
                  </Alert>
                ) : null}
                <SelectableFlashcardList
                  cards={pickerCards}
                  collectionNames={collectionNames}
                  selectedIds={new Set(pickedCards.keys())}
                  onToggle={togglePicked}
                  onSelectMany={pickMany}
                  onClear={() => setPickedCards(new Map())}
                  maxSelectable={MAX_EXAM_CARDS}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">{t("timeHeading")}</h2>
        <div className="flex items-center gap-3">
          <Switch id="exam-timed" checked={timed} onCheckedChange={setTimed} />
          <Label htmlFor="exam-timed" className="text-sm font-medium text-foreground">
            {t("timeSwitch")}
          </Label>
        </div>
        {timed ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_EXAM_MINUTES}
                aria-label={t("minutesLabel")}
                value={minutes || ""}
                onChange={(event) => setMinutes(clampInt(Number(event.target.value) || 0, 0, MAX_EXAM_MINUTES))}
                className="w-24"
              />
              <span className="text-sm text-foreground-muted">{t("minutesUnit")}</span>
              {TIME_PRESETS.map((preset) => (
                <ChipButton key={preset} active={minutes === preset} onClick={() => setMinutes(preset)}>
                  {t("presetMinutes", { minutes: preset })}
                </ChipButton>
              ))}
            </div>
            <p className="text-xs text-foreground-muted">{t("timedHint")}</p>
          </div>
        ) : (
          <p className="text-xs text-foreground-muted">{t("untimedHint")}</p>
        )}
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <p className="text-sm text-foreground-muted">
          {questionCount === 0
            ? t("startHintEmpty")
            : timeLimit
              ? t("startSummaryTimed", { count: questionCount, minutes: timeLimit })
              : t("startSummaryUntimed", { count: questionCount })}
        </p>
        <Button type="button" size="lg" disabled={!canStart} onClick={start}>
          {starting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ClipboardCheck className="size-4" aria-hidden="true" />
          )}
          {t("startButton")}
        </Button>
      </div>
    </div>
  );
}

function ChipButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-brand-turquoise bg-brand-turquoise/10 text-brand-turquoise"
          : "border-border text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
