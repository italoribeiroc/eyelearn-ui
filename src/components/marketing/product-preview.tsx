"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Flame, Target } from "lucide-react";
import { MockFlashcard } from "@/components/shared/mock-flashcard";

// Illustrative baseline: this mock set pretends the visitor has already
// studied 13 of today's 20-card goal before touching anything. Flipping a
// demo card to its answer counts as "studying" it, nudging both numbers up;
// flipping back undoes it. Capped at the goal so a visitor can't overflow
// past 20/20 with only 3 cards.
const BASE_STUDIED = 13;
const DAILY_GOAL = 20;
const DEMO_CARDS = ["card1", "card2", "card3"] as const;

export function ProductPreview() {
  const t = useTranslations("productPreview");
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  function toggleCard(id: string) {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const flippedCount = Object.values(flipped).filter(Boolean).length;
  const studied = Math.min(BASE_STUDIED + flippedCount, DAILY_GOAL);
  const progressPercent = (studied / DAILY_GOAL) * 100;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
        </div>

        <div className="mt-14 overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-soft-lg)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-muted/60 px-6 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {t("setLabel")}
              </p>
              <p className="font-heading text-lg font-semibold text-foreground">
                {t("setName")}
              </p>
            </div>
            <div className="flex items-center gap-5">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent">
                <Flame className="size-4" aria-hidden="true" />
                {t("streak")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-turquoise">
                <Target className="size-4" aria-hidden="true" />
                {t("dailyGoal")}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            {DEMO_CARDS.map((id) => (
              <MockFlashcard
                key={id}
                eyebrow={t(`${id}.eyebrow`)}
                question={t(`${id}.question`)}
                answer={t(`${id}.answer`)}
                flipped={!!flipped[id]}
                onFlip={() => toggleCard(id)}
                flipHint={t("tapToFlip")}
              />
            ))}
          </div>

          <div className="border-t border-border px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                {t("progressLabel")}
              </span>
              <span className="text-foreground-muted">
                {t("progressValue", { studied, total: DAILY_GOAL })}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-turquoise to-brand-mint transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-foreground-muted">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
