"use client";

import { Eye, FlipHorizontal2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { StudyCardStyle } from "@/hooks/use-study-card-style";

/**
 * Lets the user choose how a Basic card's answer is revealed: the existing
 * "Show answer" button, or the landing page's flip animation (see
 * FlipBasicCard). Always rendered regardless of the current card's type --
 * it's a no-op for multiple-choice/typed-answer cards, but staying in the
 * same place avoids a layout jump as the queue mixes card types. Purely
 * controlled (mirrors CollectionViewToggle's pill-button styling); the
 * caller owns persistence via useStudyCardStyle.
 */
export function StudyCardStyleToggle({
  style,
  onChange,
}: {
  style: StudyCardStyle;
  onChange: (style: StudyCardStyle) => void;
}) {
  const t = useTranslations("flashcards.study.cardStyle");

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      <Button
        type="button"
        variant={style === "reveal" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={t("reveal")}
        aria-pressed={style === "reveal"}
        onClick={() => onChange("reveal")}
      >
        <Eye className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant={style === "flip" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={t("flip")}
        aria-pressed={style === "flip"}
        onClick={() => onChange("flip")}
      >
        <FlipHorizontal2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
