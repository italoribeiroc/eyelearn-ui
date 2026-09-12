"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RATINGS, RATING_STYLES } from "@/components/flashcards/study/ratings";
import { cn } from "@/lib/utils";
import type { ReviewRating, ReviewResult } from "@/lib/api/types";

/**
 * The Again/Hard/Good/Easy grid shown once a Basic card's answer is
 * visible, or the "Rating recorded" line once it's been rated -- shared by
 * both the reveal-button BasicCard and the flip-card variant so the two
 * presentations never drift out of sync.
 */
export function RatingButtons({
  result,
  submitting,
  onRate,
}: {
  result: ReviewResult | null;
  submitting: boolean;
  onRate: (rating: ReviewRating) => void;
}) {
  const t = useTranslations("flashcards.study");

  if (result) {
    return <p className="text-sm font-medium text-foreground-muted">{t("ratingRecorded")}</p>;
  }

  return (
    // Bigger, taller buttons on narrow screens: a 2x2 grid has plenty of
    // room to spare there, and a full-width row of 4 doesn't appear until
    // sm:, where the smaller size (matching the rest of the app's compact
    // controls) fits comfortably instead.
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
      {RATINGS.map((rating) => (
        <Button
          key={rating.value}
          type="button"
          variant="outline"
          size="sm"
          disabled={submitting}
          onClick={() => onRate(rating.value)}
          className={cn("h-14 text-base sm:h-9 sm:text-[0.8rem]", RATING_STYLES[rating.value].className)}
          style={RATING_STYLES[rating.value].style}
        >
          {t(`ratings.${rating.labelKey}`)}
        </Button>
      ))}
    </div>
  );
}
