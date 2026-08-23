"use client";

import { FolderOpen, GraduationCap, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Collection } from "@/lib/api/types";
import { CollectionFormDialog } from "./collection-form-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";

export function CollectionCard({ collection }: { collection: Collection }) {
  const t = useTranslations("flashcards");

  async function handleDelete() {
    const res = await fetch(`/api/flashcards/collections/${collection.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete collection");
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/flashcards/${collection.id}`} className="min-w-0">
          <h3 className="truncate font-heading text-base font-bold text-foreground hover:underline">
            {collection.name}
          </h3>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <CollectionFormDialog
            mode="edit"
            collection={collection}
            trigger={
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.edit")}>
                <Pencil className="size-3.5" aria-hidden="true" />
              </Button>
            }
          />
          <DeleteConfirmDialog
            title={t("deleteCollection.title")}
            description={t("deleteCollection.description", { name: collection.name })}
            onConfirm={handleDelete}
            trigger={
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.delete")}>
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            }
          />
        </div>
      </div>

      {collection.description ? (
        <p className="line-clamp-2 text-sm text-foreground-muted">{collection.description}</p>
      ) : null}

      <div className="mt-1 flex flex-wrap gap-2">
        <Button asChild type="button" variant="outline" size="sm">
          <Link href={`/flashcards/${collection.id}`}>
            <FolderOpen className="size-3.5" aria-hidden="true" />
            {t("common.open")}
          </Link>
        </Button>
        <Button asChild type="button" variant="secondary" size="sm">
          <Link href={`/flashcards/${collection.id}/study`}>
            <GraduationCap className="size-3.5" aria-hidden="true" />
            {t("common.study")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
