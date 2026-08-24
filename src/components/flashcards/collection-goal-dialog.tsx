"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CollectionGoalSection } from "@/components/flashcards/collection-goal-section";

/** Dedicated goal-setting dialog, triggered directly from a collection card/row/detail page. */
export function CollectionGoalDialog({
  collectionId,
  collectionName,
  trigger,
}: {
  collectionId: number;
  collectionName: string;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("flashcards.goal");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-turquoise/10">
              <Target className="size-5 text-brand-turquoise" aria-hidden="true" />
            </span>
            <DialogTitle className="font-heading text-xl font-bold text-foreground">
              {t("dialogTitle", { name: collectionName })}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm">{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <CollectionGoalSection collectionId={collectionId} open={open} />
      </DialogContent>
    </Dialog>
  );
}
