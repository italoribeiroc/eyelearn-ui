"use client";

import { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "@/i18n/navigation";
import { buildCollectionTree, flattenCollectionTree } from "@/lib/flashcards/tree";
import type { Collection } from "@/lib/api/types";

export function CollectionPicker({ collections }: { collections: Collection[] }) {
  const t = useTranslations("study.customPicker");
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const rows = useMemo(() => flattenCollectionTree(buildCollectionTree(collections)), [collections]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function start() {
    router.push(`/study/custom/session?collections=${Array.from(selected).join(",")}`);
  }

  if (rows.length === 0) {
    return <p className="text-sm text-foreground-muted">{t("noCollections")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.map(({ collection, depth }) => (
          <label
            key={collection.id}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-surface-muted"
            style={{ paddingLeft: `${16 + depth * 20}px` }}
          >
            <Checkbox
              checked={selected.has(collection.id)}
              onCheckedChange={() => toggle(collection.id)}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {collection.name}
            </span>
            <span className="shrink-0 text-xs text-foreground-muted">
              {t("cardCount", { count: collection.flashcard_count })}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground-muted">
          {selected.size === 0 ? t("emptySelectionHint") : t("selectedCount", { count: selected.size })}
        </p>
        <Button type="button" size="lg" disabled={selected.size === 0} onClick={start}>
          <GraduationCap className="size-4" aria-hidden="true" />
          {t("startButton")}
        </Button>
      </div>
    </div>
  );
}
