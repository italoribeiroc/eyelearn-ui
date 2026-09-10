"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CollectionAccordionList } from "@/components/flashcards/collection-accordion-list";
import { CollectionCard } from "@/components/flashcards/collection-card";
import { CollectionViewToggle, type CollectionViewMode } from "@/components/flashcards/collection-view-toggle";
import { SearchInput } from "@/components/flashcards/search-input";
import type { Collection } from "@/lib/api/types";

/**
 * Collections list with client-side search. When the query is empty this
 * renders the normal browse experience (root collections, grid or nested
 * list per the view toggle). While searching it matches every collection
 * the user owns at any depth by name or description, and shows the hits as
 * a flat card grid since a matched subcollection has no meaningful parent
 * context in the results.
 */
export function CollectionsBrowser({
  allCollections,
  rootCollections,
  view,
}: {
  allCollections: Collection[];
  rootCollections: Collection[];
  view: CollectionViewMode;
}) {
  const t = useTranslations("flashcards");
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!trimmed) return null;
    return allCollections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(trimmed) ||
        collection.description.toLowerCase().includes(trimmed),
    );
  }, [allCollections, trimmed]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("search.collectionsPlaceholder")}
        />
        <div className="flex items-center gap-3">
          {matches ? (
            <p className="text-xs text-foreground-muted">
              {t("search.resultCount", { count: matches.length })}
            </p>
          ) : null}
          {matches ? null : <CollectionViewToggle view={view} />}
        </div>
      </div>

      {matches ? (
        matches.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-foreground-muted">
            {t("search.noCollections")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )
      ) : view === "list" ? (
        <CollectionAccordionList items={rootCollections} allCollections={allCollections} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rootCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
