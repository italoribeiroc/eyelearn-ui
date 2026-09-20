"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  buildCollectionNodeMap,
  buildCollectionTree,
  flattenCollectionTree,
  type CollectionNode,
} from "@/lib/flashcards/tree";
import type { Collection } from "@/lib/api/types";

function collectSubtreeIds(node: CollectionNode, into: number[] = []): number[] {
  into.push(node.collection.id);
  for (const child of node.children) collectSubtreeIds(child, into);
  return into;
}

/**
 * Indented checkbox list of a user's collections (used by the custom-study
 * and exam pickers). With `cascade`, checking a collection also checks all
 * of its sub-collections (and unchecking clears them), so a picker whose
 * backend only looks at the exact ids chosen still ends up covering a whole
 * branch; individual sub-collections can then be unchecked on their own.
 */
export function CollectionCheckboxList({
  collections,
  selectedIds,
  onChange,
  cascade = false,
  cardCountLabel,
}: {
  collections: Collection[];
  selectedIds: Set<number>;
  onChange: (next: Set<number>) => void;
  cascade?: boolean;
  cardCountLabel: (count: number) => string;
}) {
  const rows = useMemo(() => flattenCollectionTree(buildCollectionTree(collections)), [collections]);
  const nodeMap = useMemo(() => buildCollectionNodeMap(collections), [collections]);

  function toggle(id: number) {
    const next = new Set(selectedIds);
    const turnOn = !next.has(id);
    const affected = cascade && nodeMap.has(id) ? collectSubtreeIds(nodeMap.get(id)!) : [id];
    for (const affectedId of affected) {
      if (turnOn) next.add(affectedId);
      else next.delete(affectedId);
    }
    onChange(next);
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {rows.map(({ collection, depth }) => (
        <label
          key={collection.id}
          className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-surface-muted"
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          <Checkbox checked={selectedIds.has(collection.id)} onCheckedChange={() => toggle(collection.id)} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {collection.name}
          </span>
          <span className="shrink-0 text-xs text-foreground-muted">
            {cardCountLabel(collection.flashcard_count)}
          </span>
        </label>
      ))}
    </div>
  );
}
