"use client";

import { useMemo } from "react";
import { FolderOpen, GraduationCap, Pencil, Target, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollectionFormDialog } from "@/components/flashcards/collection-form-dialog";
import { CollectionGoalDialog } from "@/components/flashcards/collection-goal-dialog";
import { DeleteConfirmDialog } from "@/components/flashcards/delete-confirm-dialog";
import { Link } from "@/i18n/navigation";
import { buildCollectionNodeMap, type CollectionNode } from "@/lib/flashcards/tree";
import type { Collection } from "@/lib/api/types";

function CollectionRow({ node }: { node: CollectionNode }) {
  const t = useTranslations("flashcards");
  const { collection, children } = node;

  async function handleDelete() {
    const res = await fetch(`/api/flashcards/collections/${collection.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete collection");
  }

  const label = (
    <div className="min-w-0 flex-1 pr-2 text-left">
      <p className="truncate text-sm font-semibold text-foreground">{collection.name}</p>
      {collection.description ? (
        <p className="line-clamp-1 text-xs font-normal text-foreground-muted">{collection.description}</p>
      ) : null}
    </div>
  );

  const count = (
    <span className="shrink-0 text-xs font-normal text-foreground-muted">
      {t("view.cardCount", { count: collection.flashcard_count })}
    </span>
  );

  const dueBadge =
    collection.due_count > 0 ? (
      <Badge variant="outline" className="shrink-0 border-brand-turquoise/40 text-brand-turquoise">
        {t("view.dueBadge", { count: collection.due_count })}
      </Badge>
    ) : null;

  const actions = (
    <div className="flex shrink-0 items-center gap-1">
      <Button asChild type="button" variant="ghost" size="icon-sm" aria-label={t("common.open")}>
        <Link href={`/flashcards/${collection.id}`}>
          <FolderOpen className="size-3.5" aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild type="button" variant="ghost" size="icon-sm" aria-label={t("common.study")}>
        <Link href={`/flashcards/${collection.id}/study`}>
          <GraduationCap className="size-3.5" aria-hidden="true" />
        </Link>
      </Button>
      <CollectionGoalDialog
        collectionId={collection.id}
        collectionName={collection.name}
        trigger={
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("goal.buttonLabel")}>
            <Target className="size-3.5" aria-hidden="true" />
          </Button>
        }
      />
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
  );

  if (children.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        {label}
        {dueBadge}
        {count}
        {actions}
        <div className="size-9 shrink-0" aria-hidden="true" />
      </div>
    );
  }

  return (
    <AccordionItem value={String(collection.id)}>
      <div className="flex items-center gap-3 px-4 py-1">
        {label}
        {dueBadge}
        {count}
        {actions}
        <AccordionTrigger className="flex-none items-center justify-center gap-0 rounded-full p-2.5 hover:bg-surface-muted hover:no-underline" />
      </div>
      <AccordionContent className="pr-4 pl-8">
        <Accordion type="multiple" className="divide-y divide-border">
          {children.map((child) => (
            <CollectionRow key={child.collection.id} node={child} />
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * List/accordion visualization of collections, alternative to the big-card
 * grid. `items` is the set to render at the top of this particular list
 * (global roots, or one collection's direct subcollections); `allCollections`
 * is the full flat set used to resolve nested children at any depth.
 */
export function CollectionAccordionList({
  items,
  allCollections,
}: {
  items: Collection[];
  allCollections: Collection[];
}) {
  const nodeMap = useMemo(() => buildCollectionNodeMap(allCollections), [allCollections]);
  const topNodes = items
    .map((item) => nodeMap.get(item.id))
    .filter((node): node is CollectionNode => node !== undefined);

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface">
      <Accordion type="multiple">
        {topNodes.map((node) => (
          <CollectionRow key={node.collection.id} node={node} />
        ))}
      </Accordion>
    </div>
  );
}
