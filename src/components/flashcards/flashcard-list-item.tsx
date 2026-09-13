"use client";

import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/flashcards/rich-text-content";
import type { Flashcard } from "@/lib/api/types";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { FlashcardFormDialog } from "./flashcard-form-dialog";

/** Wrapped in memo() since a large collection's list renders many of these
 * at once (see FlashcardSearchList's virtualized list) -- `flashcard` is a
 * stable reference from the page's fetched array, so a shallow prop
 * comparison is enough to skip re-rendering items whose own data hasn't
 * changed when the list re-renders for unrelated reasons (typing in the
 * search box, scrolling the virtualized window). */
function FlashcardListItemImpl({
  flashcard,
  collectionId,
}: {
  flashcard: Flashcard;
  collectionId: number;
}) {
  const t = useTranslations("flashcards");
  const tTypes = useTranslations("flashcards.cardType");

  async function handleDelete() {
    const res = await fetch(`/api/flashcards/cards/${flashcard.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete flashcard");
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0">
        <Badge variant="outline" className="mb-1.5 text-xs text-foreground-muted">
          {tTypes(flashcard.card_type)}
        </Badge>
        <RichTextContent
          html={flashcard.prompt}
          className="line-clamp-2 text-sm font-medium text-foreground"
        />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <FlashcardFormDialog
          mode="edit"
          collectionId={collectionId}
          flashcard={flashcard}
          trigger={
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.edit")}>
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
          }
        />
        <DeleteConfirmDialog
          title={t("deleteFlashcard.title")}
          description={t("deleteFlashcard.description")}
          onConfirm={handleDelete}
          trigger={
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.delete")}>
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          }
        />
      </div>
    </div>
  );
}

export const FlashcardListItem = memo(FlashcardListItemImpl);
