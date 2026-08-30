import { BookOpen, Eye, type LucideIcon, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small illustrative mocks for the onboarding steps that are otherwise just
 * title + body text, so every step in the guide carries some visual weight
 * (steps 2 and 3 already have the flashcard demo and the colored rating
 * preview). Built the same way `MockFlashcard` is, plain DOM + Tailwind
 * tokens rather than inline SVG, so colors stay theme-aware for free and
 * nothing here needs its own light/dark handling.
 */

function ChipCard({
  icon: Icon,
  colorClassName,
  rotateClassName,
  offsetClassName,
}: {
  icon: LucideIcon;
  colorClassName: string;
  rotateClassName: string;
  offsetClassName: string;
}) {
  return (
    <div
      className={cn(
        "absolute flex size-16 items-center justify-center rounded-xl border bg-surface shadow-[var(--shadow-soft)]",
        colorClassName,
        rotateClassName,
        offsetClassName,
      )}
    >
      <Icon className="size-6" aria-hidden="true" />
    </div>
  );
}

/** A fanned stack of flashcards for the "Welcome" step: a quick visual cue
 * for "this app is about flashcards", before any of the copy explains it. */
export function WelcomeIllustration() {
  return (
    <div className="relative flex h-28 items-center justify-center" aria-hidden="true">
      <ChipCard
        icon={BookOpen}
        colorClassName="border-brand-mint/30 text-brand-mint bg-brand-mint/10"
        rotateClassName="-rotate-12"
        offsetClassName="left-1/2 top-1/2 -translate-x-[calc(50%+2.25rem)] -translate-y-1/2"
      />
      <ChipCard
        icon={Sparkles}
        colorClassName="border-brand-accent/30 text-brand-accent bg-brand-accent/10"
        rotateClassName="rotate-12"
        offsetClassName="left-1/2 top-1/2 -translate-x-[calc(50%-2.25rem)] -translate-y-1/2"
      />
      <ChipCard
        icon={Eye}
        colorClassName="z-10 border-brand-turquoise/30 text-brand-turquoise bg-brand-turquoise/10"
        rotateClassName=""
        offsetClassName="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}

/** For the "mastery" step: a simple growth chart, bars rising left to
 * right on the same red-to-green gradient as the rating buttons shown one
 * step earlier, so the two screens visually reinforce the same idea (each
 * honest rating nudges a card's bar a little higher), topped with a
 * trophy over the tallest, greenest bar. */
export function MasteryIllustration() {
  const bars = [
    { color: "bg-error", height: 26 },
    { color: "bg-warning", height: 46 },
    { color: "bg-brand-mint", height: 68 },
    { color: "bg-success", height: 92 },
  ];

  return (
    <div
      className="flex h-28 items-end justify-center gap-3 border-b border-border pb-0"
      aria-hidden="true"
    >
      {bars.map((bar, index) => {
        const isLast = index === bars.length - 1;
        return (
          <div key={index} className="relative flex flex-col items-center">
            {isLast ? (
              <span className="absolute -top-9 flex size-7 items-center justify-center rounded-full border border-brand-accent/30 bg-brand-accent/10 text-brand-accent">
                <Trophy className="size-4" aria-hidden="true" />
              </span>
            ) : null}
            <span
              className={cn("w-6 rounded-t-md sm:w-7", bar.color)}
              style={{ height: `${bar.height}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}
