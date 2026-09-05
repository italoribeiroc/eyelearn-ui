"use client";

import { useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CONFETTI_COLORS = [
  "var(--color-brand-turquoise)",
  "var(--color-brand-mint)",
  "var(--color-brand-accent)",
  "var(--color-warning)",
];

function ConfettiBurst() {
  const [pieces] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.25,
      duration: 0.8 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 90,
    })),
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-6 z-20 overflow-visible"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-0 block size-2 animate-confetti-fall rounded-[2px]"
          style={
            {
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--confetti-drift": `${piece.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** The illustrative flashcard shown beside the hero headline. Click/Enter/
 * Space flips it to the answer, bumps the floating "today's goal" badge
 * to 100%, and fires a one-off confetti burst -- same click-to-flip
 * mechanic as MockFlashcard, kept as its own component since this card's
 * layout (streak + progress footer, floating badge) doesn't match that
 * one's shape.
 *
 * Only the front face is positioned in normal flow; the back face is
 * absolutely positioned over it. That's deliberate, not an oversight --
 * with both faces absolutely positioned (and thus needing an explicit
 * height on their shared parent), an earlier version guessed a min-height
 * that ended up shorter than this card was before it could flip at all.
 * Letting the front face size the container the normal way reproduces the
 * original spacing/height exactly, no guessing required.
 */
export function HeroPreviewCard() {
  const t = useTranslations("hero.previewCard");
  const [flipped, setFlipped] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);

  function handleFlip() {
    const next = !flipped;
    setFlipped(next);
    if (next) {
      setBurstId((n) => n + 1);
      setConfettiActive(true);
      window.setTimeout(() => setConfettiActive(false), 1200);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleFlip();
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="[perspective:1400px]">
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? t("answer") : t("question")}
          onClick={handleFlip}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative w-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <div
            aria-hidden={flipped}
            className="flex flex-col rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft-lg)] [backface-visibility:hidden]"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand-mint/15 px-3 py-1 text-xs font-semibold text-brand-turquoise">
                {t("tag")}
              </span>
              <Sparkles className="size-4 text-brand-accent" aria-hidden="true" />
            </div>
            <p className="mt-5 font-heading text-xl font-semibold text-foreground">
              {t("question")}
            </p>
            <p className="mt-3 w-fit text-sm text-foreground-muted">{t("hint")}</p>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent">
                <Flame className="size-4" aria-hidden="true" />
                {t("streak")}
              </span>
              <span className="text-xs text-foreground-muted">{t("progress")}</span>
            </div>
          </div>

          <div
            aria-hidden={!flipped}
            className="absolute inset-0 flex flex-col rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft-lg)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <span className="self-start rounded-full bg-brand-mint/15 px-3 py-1 text-xs font-semibold text-brand-turquoise">
              {t("tag")}
            </span>
            <p className="mt-5 font-heading text-xl font-semibold text-foreground">
              {t("answer")}
            </p>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent">
                <Flame className="size-4" aria-hidden="true" />
                {t("streak")}
              </span>
              <span className="text-xs text-foreground-muted">{t("progressDone")}</span>
            </div>
          </div>
        </div>
      </div>

      {confettiActive ? <ConfettiBurst key={burstId} /> : null}

      <div
        aria-hidden="true"
        className="absolute -bottom-6 -left-6 hidden rotate-[-6deg] rounded-lg border border-border bg-surface px-4 py-3 shadow-[var(--shadow-soft)] sm:block"
      >
        <p className="text-xs font-medium text-foreground-muted">{t("floatingLabel")}</p>
        <p className="font-heading text-lg font-bold text-brand-turquoise">
          {flipped ? t("floatingValueDone") : t("floatingValue")}
        </p>
      </div>
    </div>
  );
}
