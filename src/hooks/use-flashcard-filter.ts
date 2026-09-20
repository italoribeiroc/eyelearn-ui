"use client";

import { useMemo, useState } from "react";
import { stripRichTextToPlainText } from "@/components/flashcards/rich-text-content";
import type { CardType, Flashcard } from "@/lib/api/types";

export type TypeFilter = CardType | "all";
export type SortMode = "newest" | "oldest" | "title-asc" | "title-desc";

/**
 * Search text and title for one card, with rich-text markup stripped first so
 * a query matches the words a user actually sees (prompt, answer, choice
 * options, accepted answers).
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

/**
 * Client-side search / type filter / attachment filter / sort over a set of
 * cards already in memory. Shared by the collection page's card list and the
 * exam card picker so the two behave identically.
 */
export function useFlashcardFilter(flashcards: Flashcard[]) {
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
    return sorted.map((entry) => entry.flashcard);
  }, [indexed, typeFilter, mediaOnly, trimmed, sort]);

  return {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    mediaOnly,
    setMediaOnly,
    sort,
    setSort,
    trimmed,
    visible,
    isFiltered: trimmed.length > 0 || typeFilter !== "all" || mediaOnly,
  };
}

export type FlashcardFilter = ReturnType<typeof useFlashcardFilter>;
