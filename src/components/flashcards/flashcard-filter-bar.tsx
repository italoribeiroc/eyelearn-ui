"use client";

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
import { SearchInput } from "@/components/flashcards/search-input";
import type { FlashcardFilter, SortMode, TypeFilter } from "@/hooks/use-flashcard-filter";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: TypeFilter[] = ["all", "basic", "multiple_choice", "typed_answer"];
const SORT_LABEL_KEYS: Record<SortMode, string> = {
  newest: "filters.sortNewest",
  oldest: "filters.sortOldest",
  "title-asc": "filters.sortTitleAsc",
  "title-desc": "filters.sortTitleDesc",
};
const SORT_OPTIONS = Object.keys(SORT_LABEL_KEYS) as SortMode[];

/** Search box + type / attachment filters + sort menu driven by useFlashcardFilter. */
export function FlashcardFilterBar({ filter }: { filter: FlashcardFilter }) {
  const t = useTranslations("flashcards");
  const tType = useTranslations("flashcards.cardType");
  const { query, setQuery, typeFilter, setTypeFilter, mediaOnly, setMediaOnly, sort, setSort } = filter;

  const typeLabel = typeFilter === "all" ? t("filters.allTypes") : tType(typeFilter);

  return (
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
          <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as SortMode)}>
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {t(SORT_LABEL_KEYS[option])}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
