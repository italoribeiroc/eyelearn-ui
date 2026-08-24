"use client";

import { LayoutGrid, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";

export type CollectionViewMode = "grid" | "list";

export function CollectionViewToggle({ view }: { view: CollectionViewMode }) {
  const t = useTranslations("flashcards.view");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(next: CollectionViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      <Button
        type="button"
        variant={view === "grid" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={t("gridView")}
        aria-pressed={view === "grid"}
        onClick={() => setView("grid")}
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant={view === "list" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={t("listView")}
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
      >
        <List className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
