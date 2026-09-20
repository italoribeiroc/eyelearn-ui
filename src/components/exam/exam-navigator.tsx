"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavigatorItem = { answered: boolean; failed: boolean };

/** Previous/next plus a numbered grid, so questions can be skipped and revisited. */
export function ExamNavigator({
  items,
  current,
  onGo,
}: {
  items: NavigatorItem[];
  current: number;
  onGo: (index: number) => void;
}) {
  const t = useTranslations("exam.session");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" disabled={current === 0} onClick={() => onGo(current - 1)}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t("previous")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={current >= items.length - 1}
          onClick={() => onGo(current + 1)}
        >
          {t("next")}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <nav aria-label={t("navigatorLabel")}>
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
          {items.map((item, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => onGo(index)}
                aria-current={index === current ? "step" : undefined}
                aria-label={t("goToQuestion", {
                  number: index + 1,
                  state: item.failed ? t("stateFailed") : item.answered ? t("stateAnswered") : t("stateUnanswered"),
                })}
                className={cn(
                  "flex size-11 w-full items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors",
                  item.failed
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : item.answered
                      ? "border-brand-turquoise/40 bg-brand-turquoise/10 text-brand-turquoise"
                      : "border-dashed border-border text-foreground-muted hover:bg-muted",
                  index === current && "ring-2 ring-brand-turquoise ring-offset-2 ring-offset-background",
                )}
              >
                {index + 1}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
