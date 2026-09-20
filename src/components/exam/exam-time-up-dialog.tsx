"use client";

import { Hourglass, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shown when the time limit runs out. It's a real decision, so it can't be
 * dismissed with Escape or a click outside: the user either finishes now, or
 * keeps going with no clock (their later answers are still flagged as late).
 */
export function ExamTimeUpDialog({
  open,
  answered,
  total,
  finishing,
  onFinish,
  onKeepGoing,
}: {
  open: boolean;
  answered: number;
  total: number;
  finishing: boolean;
  onFinish: () => void;
  onKeepGoing: () => void;
}) {
  const t = useTranslations("exam.timeUp");

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md"
      >
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-full bg-warning/15">
            <Hourglass className="size-5 text-warning" aria-hidden="true" />
          </span>
          <DialogTitle className="text-lg">{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { answered, total })}</DialogDescription>
          <p className="text-xs text-muted-foreground">{t("keepGoingHint")}</p>
        </DialogHeader>
        {/* Always stacked and full-width: the labels are long, and a single
            row overflowed the narrow dialog on desktop and mobile alike. */}
        <DialogFooter className="flex-col-reverse sm:flex-col-reverse sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            disabled={finishing}
            onClick={onKeepGoing}
            className="h-auto min-h-11 w-full py-2 whitespace-normal"
          >
            {t("keepGoing")}
          </Button>
          <Button
            type="button"
            disabled={finishing}
            onClick={onFinish}
            className="h-auto min-h-11 w-full py-2 whitespace-normal"
          >
            {finishing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {t("finish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
