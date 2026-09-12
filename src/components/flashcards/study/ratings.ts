import type { CSSProperties } from "react";
import type { ReviewRating } from "@/lib/api/types";

export const RATINGS: { value: ReviewRating; labelKey: string }[] = [
  { value: 1, labelKey: "again" },
  { value: 2, labelKey: "hard" },
  { value: 3, labelKey: "good" },
  { value: 4, labelKey: "easy" },
];

// Again -> Hard -> Good -> Easy on a red-to-green gradient, so the meaning
// of each button is visible at a glance (not just from its label). "Good"
// sits between the warning and success tokens with no named token of its
// own, so it's built with color-mix() instead of a new hardcoded hex value.
export const RATING_STYLES: Record<ReviewRating, { className?: string; style?: CSSProperties }> = {
  1: { className: "border-error bg-error/10 text-error hover:bg-error/15" },
  2: { className: "border-warning bg-warning/10 text-warning hover:bg-warning/15" },
  3: {
    style: {
      borderColor: "color-mix(in oklch, var(--color-warning), var(--color-success) 55%)",
      backgroundColor: "color-mix(in oklch, var(--color-warning), var(--color-success) 55%, transparent 90%)",
      color: "color-mix(in oklch, var(--color-warning), var(--color-success) 55%)",
    },
  },
  4: { className: "border-success bg-success/10 text-success hover:bg-success/15" },
};
