"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";
import { FlashcardFilterBar } from "@/components/flashcards/flashcard-filter-bar";
import { FlashcardListItem } from "@/components/flashcards/flashcard-list-item";
import { useFlashcardFilter } from "@/hooks/use-flashcard-filter";
import type { Flashcard } from "@/lib/api/types";

// Only the row-mounting step is virtualized -- search/filter/sort (see
// useFlashcardFilter) still run over the full in-memory array. A large
// collection (1000+ cards) would otherwise mount that many full
// FlashcardListItem subtrees at once; this caps DOM node count to roughly
// the visible viewport regardless of how many cards match the current
// filters. ESTIMATED_ROW_HEIGHT_PX is just react-virtual's initial guess --
// actual heights are measured per row (see measureElement below) since a
// card's rendered height varies a little with its content.
const ESTIMATED_ROW_HEIGHT_PX = 88;
const ROW_GAP_PX = 8; // matches the space-y-2 gap this replaces

/**
 * Searchable, filterable, sortable list of the flashcards in one
 * collection. The whole set is already loaded by the page (see
 * lib/flashcards/api.ts), so search, filter, and sort all run client-side
 * (see useFlashcardFilter).
 */
export function FlashcardSearchList({
  flashcards,
  collectionId,
}: {
  flashcards: Flashcard[];
  collectionId: number;
}) {
  const t = useTranslations("flashcards");
  const filter = useFlashcardFilter(flashcards);
  const { visible, isFiltered, trimmed } = filter;

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT_PX,
    overscan: 8,
    gap: ROW_GAP_PX,
  });

  return (
    <div className="space-y-3">
      <FlashcardFilterBar filter={filter} />

      {isFiltered ? (
        <p className="text-xs text-foreground-muted">
          {t("search.resultCount", { count: visible.length })}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-foreground-muted">
          {trimmed ? t("search.noFlashcards") : t("filters.empty")}
        </p>
      ) : (
        <div ref={scrollRef} className="thin-scrollbar max-h-[32rem] overflow-y-auto rounded-lg pr-3">
          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const flashcard = visible[virtualRow.index];
              return (
                <div
                  key={flashcard.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <FlashcardListItem flashcard={flashcard} collectionId={collectionId} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
