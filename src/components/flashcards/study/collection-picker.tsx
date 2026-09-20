"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { CollectionCheckboxList } from "@/components/flashcards/collection-checkbox-list";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { Collection } from "@/lib/api/types";

export function CollectionPicker({ collections }: { collections: Collection[] }) {
  const t = useTranslations("study.customPicker");
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function start() {
    router.push(`/study/custom/session?collections=${Array.from(selected).join(",")}`);
  }

  if (collections.length === 0) {
    return <p className="text-sm text-foreground-muted">{t("noCollections")}</p>;
  }

  return (
    <div className="space-y-6">
      <CollectionCheckboxList
        collections={collections}
        selectedIds={selected}
        onChange={setSelected}
        cardCountLabel={(count) => t("cardCount", { count })}
      />

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
