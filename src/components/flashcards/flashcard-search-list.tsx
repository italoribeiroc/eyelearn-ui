"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpDown, Paperclip, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlashcardListItem } from "@/components/flashcards/flashcard-list-item";
import { stripRichTextToPlainText } from "@/components/flashcards/rich-text-content";
import { SearchInput } from "@/components/flashcards/search-input";
import { cn } from "@/lib/utils";
import type { CardType, Flashcard } from "@/lib/api/types";

type TypeFilter = CardType | "all";
type SortMode = "newest" | "oldest" | "title-asc" | "title-desc";

const TYPE_OPTIONS: TypeFilter[] = ["all", "basic", "multiple_choice", "typed_answer"];
const SORT_LABEL_KEYS: Record<SortMode, string> = {
  newest: "filters.sortNewest",
  oldest: "filters.sortOldest",
  "title-asc": "filters.sortTitleAsc",
  "title-desc": "filters.sortTitleDesc",
};
const SORT_OPTIONS = Object.keys(SORT_LABEL_KEYS) as SortMode[];

// Only the row-mounting step is virtualized -- search/filter/sort below
// still run over the full in-memory array exactly as before. A large
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
 * lib/flashcards/api.ts), so all three run client-side: matching over the
 * prompt, answer, choice options, and accepted answers (rich-text markup
 * stripped first so a query matches the words a user actually sees);
 * filtering by card type and whether the card has attachments; sorting by
 * creation date or by the prompt text.
 */
function indexCard(flashcard: Flashcard) {
  const title = stripRichTextToPlainText(flashcard.prompt);
  const text = [
    title,
    stripRichTextToPlainText(flashcard.answer),
    ...flashcard.options.map((option) => option.text),
    ...flashcard.accepted_answers,
  ]
    .join("\n")
    .toLowerCase();
  return { flashcard, title: title.toLowerCase(), text };
}

export function FlashcardSearchList({
  flashcards,
  collectionId,
}: {
  flashcards: Flashcard[];
  collectionId: number;
}) {
  const t = useTranslations("flashcards");
  const tType = useTranslations("flashcards.cardType");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [mediaOnly, setMediaOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("oldest");

  const trimmed = query.trim().toLowerCase();
  const indexed = useMemo(() => flashcards.map(indexCard), [flashcards]);

  const visible = useMemo(() => {
    const filtered = indexed.filter((entry) => {
      if (typeFilter !== "all" && entry.flashcard.card_type !== typeFilter) return false;
      if (mediaOnly && entry.flashcard.media.length === 0) return false;
      if (trimmed && !entry.text.includes(trimmed)) return false;
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.flashcard.created_at.localeCompare(a.flashcard.created_at);
        case "oldest":
          return a.flashcard.created_at.localeCompare(b.flashcard.created_at);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    return sorted;
  }, [indexed, typeFilter, mediaOnly, trimmed, sort]);

  const typeLabel = typeFilter === "all" ? t("filters.allTypes") : tType(typeFilter);
  const isFiltered = trimmed.length > 0 || typeFilter !== "all" || mediaOnly;

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
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("search.flashcardsPlaceholder")}
          className="sm:max-w-[15rem]"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              {typeLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as TypeFilter)}
            >
              {TYPE_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {option === "all" ? t("filters.allTypes") : tType(option)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant={mediaOnly ? "secondary" : "outline"}
          size="sm"
          aria-pressed={mediaOnly}
          onClick={() => setMediaOnly((value) => !value)}
          className={cn(mediaOnly && "border-brand-turquoise/40 text-brand-turquoise")}
        >
          <Paperclip className="size-3.5" aria-hidden="true" />
          {t("filters.withMedia")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="ml-auto">
              <ArrowUpDown className="size-3.5" aria-hidden="true" />
              <span className="text-foreground-muted">{t("filters.sortLabel")}:</span>
              {t(SORT_LABEL_KEYS[sort])}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => setSort(value as SortMode)}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {t(SORT_LABEL_KEYS[option])}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
              const { flashcard } = visible[virtualRow.index];
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
