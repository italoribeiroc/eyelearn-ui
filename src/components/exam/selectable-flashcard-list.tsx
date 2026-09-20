"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FlashcardFilterBar } from "@/components/flashcards/flashcard-filter-bar";
import { stripRichTextToPlainText } from "@/components/flashcards/rich-text-content";
import { useFlashcardFilter } from "@/hooks/use-flashcard-filter";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/lib/api/types";

// Rows are a fixed compact height so the virtualizer never has to measure;
// a 1000+ card selection still mounts only the visible rows.
const ROW_HEIGHT_PX = 64;

/**
 * Searchable, filterable list of cards with a checkbox per row, for hand-
 * picking the cards of an exam. Search/filter/sort are the same as the
 * collection page's list (useFlashcardFilter); `maxSelectable` caps how many
 * can be ticked, and "select all" only ever adds what still fits.
 */
export function SelectableFlashcardList({
  cards,
  collectionNames,
  selectedIds,
  onToggle,
  onSelectMany,
  onClear,
  maxSelectable,
}: {
  cards: Flashcard[];
  collectionNames: Map<number, string>;
  selectedIds: Set<number>;
  onToggle: (card: Flashcard) => void;
  onSelectMany: (cards: Flashcard[]) => void;
  onClear: () => void;
  maxSelectable: number;
}) {
  const t = useTranslations("exam.picker");
  const tType = useTranslations("flashcards.cardType");
  const filter = useFlashcardFilter(cards);
  const { visible, isFiltered } = filter;

  const atLimit = selectedIds.size >= maxSelectable;
  const unselectedVisible = visible.filter((card) => !selectedIds.has(card.id));

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 10,
  });

  return (
    <div className="space-y-3">
      <FlashcardFilterBar filter={filter} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground-muted" aria-live="polite">
          {t("selectedCount", { count: selectedIds.size, max: maxSelectable })}
          {isFiltered ? ` · ${t("matchCount", { count: visible.length })}` : ""}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={atLimit || unselectedVisible.length === 0}
            onClick={() => onSelectMany(unselectedVisible)}
          >
            {isFiltered ? t("selectAllMatching") : t("selectAll")}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={selectedIds.size === 0} onClick={onClear}>
            {t("clear")}
          </Button>
        </div>
      </div>

      {atLimit ? <p className="text-xs text-warning">{t("limitReached", { max: maxSelectable })}</p> : null}

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-foreground-muted">
          {t("noMatches")}
        </p>
      ) : (
        <div
          ref={scrollRef}
          className="thin-scrollbar max-h-[24rem] overflow-y-auto rounded-lg border border-border bg-surface"
        >
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const card = visible[virtualRow.index];
              const checked = selectedIds.has(card.id);
              const disabled = !checked && atLimit;
              return (
                <label
                  key={card.id}
                  className={cn(
                    "absolute inset-x-0 top-0 flex cursor-pointer items-center gap-3 border-b border-border px-4 hover:bg-surface-muted",
                    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                  style={{ height: ROW_HEIGHT_PX, transform: `translateY(${virtualRow.start}px)` }}
                >
                  <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => onToggle(card)} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium text-foreground">
                      {stripRichTextToPlainText(card.prompt) || "-"}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-foreground-muted">
                      <span className="shrink-0">{tType(card.card_type)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{collectionNames.get(card.collection) ?? ""}</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
