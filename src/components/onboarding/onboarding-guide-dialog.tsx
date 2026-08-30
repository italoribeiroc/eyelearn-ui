"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { BookOpenCheck, SlidersHorizontal, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RATINGS, RATING_STYLES } from "@/components/flashcards/study/study-session";
import { MasteryIllustration, WelcomeIllustration } from "@/components/onboarding/onboarding-illustrations";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["welcome", "flashcards", "ratings", "mastery"] as const;
const STEP_ICONS = [Sparkles, BookOpenCheck, SlidersHorizontal, Trophy];
const STEP_COUNT = STEP_ICONS.length;

async function markOnboardingSeen() {
  try {
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ has_seen_onboarding: true }),
    });
  } catch {
    // Best-effort -- if this fails the guide just reappears next login,
    // a harmless inconvenience rather than something worth surfacing.
  }
}

/**
 * First-run guide for new accounts (Google or password signup), also
 * replayable any time from the Help page. Controlled internally (own
 * `open`/`step` state) rather than via the uncontrolled DialogTrigger
 * pattern most dialogs here use, since the dashboard needs it to auto-open
 * on first load without a trigger click.
 */
export function OnboardingGuideDialog({
  defaultOpen = false,
  trigger,
}: {
  defaultOpen?: boolean;
  trigger?: ReactNode;
}) {
  const t = useTranslations("onboarding");
  const tStudy = useTranslations("flashcards.study");
  const [open, setOpen] = useState(defaultOpen);
  const [step, setStep] = useState(0);
  const [revealDemo, setRevealDemo] = useState(false);

  const isLastStep = step === STEP_COUNT - 1;
  const Icon = STEP_ICONS[step];

  function resetForNextOpen() {
    setStep(0);
    setRevealDemo(false);
  }

  function finish() {
    setOpen(false);
    resetForNextOpen();
    void markOnboardingSeen();
  }

  function onOpenChange(next: boolean) {
    if (!next) {
      // Dismissing via overlay click / Escape counts the same as Skip --
      // there's no close (X) button, this is the only way out besides
      // stepping through to the end.
      finish();
      return;
    }
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-turquoise/10">
              <Icon className="size-5 text-brand-turquoise" aria-hidden="true" />
            </span>
            <DialogTitle className="font-heading text-xl font-bold text-foreground">
              {t(`steps.${STEP_KEYS[step]}.title`)}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Scrolls independently of the header/footer above and below it, so
            a short viewport (small phone, browser zoom) never traps the
            Skip/Next controls off-screen -- same pattern as
            flashcard-form-dialog's scrollable form body. */}
        <div className="max-h-[55vh] space-y-4 overflow-y-auto px-1">
          <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
            {Array.from({ length: STEP_COUNT }).map((_, dotIndex) => (
              <span
                key={dotIndex}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  dotIndex === step ? "w-6 bg-brand-turquoise" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          <span className="sr-only" role="status">
            {t("stepIndicator", { current: step + 1, total: STEP_COUNT })}
          </span>

          {step === 0 ? <WelcomeIllustration /> : null}

          <p className="text-sm text-foreground-muted">{t(`steps.${STEP_KEYS[step]}.body`)}</p>

          {step === 1 ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setRevealDemo((r) => !r)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setRevealDemo((r) => !r);
                }
              }}
              className="cursor-pointer rounded-lg border border-border bg-surface-muted p-5 text-center transition-colors hover:border-primary/40"
            >
              <p className="font-heading text-lg font-semibold text-foreground">
                {t("steps.flashcards.demoFront")}
              </p>
              {revealDemo ? (
                <p className="mt-3 text-sm font-semibold text-brand-turquoise">
                  {t("steps.flashcards.demoBack")}
                </p>
              ) : (
                <p className="mt-3 text-xs font-medium text-foreground-muted">
                  {t("steps.flashcards.tapHint")}
                </p>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-hidden="true">
                {RATINGS.map((rating) => (
                  <div
                    key={rating.value}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-full border px-3 text-[0.8rem] font-semibold",
                      RATING_STYLES[rating.value].className,
                    )}
                    style={RATING_STYLES[rating.value].style}
                  >
                    {tStudy(`ratings.${rating.labelKey}`)}
                  </div>
                ))}
              </div>
              <ul className="space-y-2 text-sm text-foreground-muted">
                {RATINGS.map((rating) => (
                  <li key={rating.value}>
                    <span className="font-semibold text-foreground">
                      {tStudy(`ratings.${rating.labelKey}`)}:
                    </span>{" "}
                    {t(`steps.ratings.${rating.labelKey}`)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === 3 ? <MasteryIllustration /> : null}
        </div>

        <div className="-mx-4 -mb-4 flex flex-col gap-2 rounded-b-xl border-t border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={finish} className="order-1 text-foreground-muted">
            {t("skipButton")}
          </Button>
          <div className="order-2 flex gap-2 sm:justify-end">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                {t("backButton")}
              </Button>
            ) : null}
            {isLastStep ? (
              <Button type="button" onClick={finish}>
                {t("getStartedButton")}
              </Button>
            ) : (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                {t("nextButton")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
