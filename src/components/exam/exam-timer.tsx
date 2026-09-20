"use client";

import { Clock, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatClock, type ExamClockPhase } from "@/hooks/use-exam-clock";
import { cn } from "@/lib/utils";

const WARNING_SECONDS = 60;

/**
 * Header clock: countdown while time remains (turning to a warning colour in
 * the last minute), `+MM:SS` overtime after the user chose to keep going, and
 * an elapsed count-up for an untimed exam. `tabular-nums` keeps the digits
 * from jiggling; it's hidden from screen readers (a per-second announcement
 * would be unbearable) and ExamSession announces only the milestones.
 */
export function ExamTimer({
  phase,
  remainingSeconds,
  overtimeSeconds,
  elapsedSeconds,
}: {
  phase: ExamClockPhase;
  remainingSeconds: number;
  overtimeSeconds: number;
  elapsedSeconds: number;
}) {
  const t = useTranslations("exam.session");
  const warning = phase === "running" && remainingSeconds <= WARNING_SECONDS;
  const overtime = phase === "overtime" || phase === "expired";

  const value =
    phase === "untimed"
      ? formatClock(elapsedSeconds)
      : overtime
        ? `+${formatClock(overtimeSeconds)}`
        : formatClock(remainingSeconds);
  const label = phase === "untimed" ? t("elapsed") : overtime ? t("overtime") : t("remaining");

  return (
    <div
      aria-hidden="true"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-heading text-base font-semibold tabular-nums",
        warning && "border-warning bg-warning/15 text-foreground",
        overtime && "border-destructive/40 bg-destructive/10 text-destructive",
        !warning && !overtime && "border-border bg-surface text-foreground",
      )}
    >
      {phase === "untimed" ? (
        <Timer className="size-4" aria-hidden="true" />
      ) : (
        <Clock className="size-4" aria-hidden="true" />
      )}
      <span>{value}</span>
      <span className="hidden text-xs font-medium text-foreground-muted sm:inline">{label}</span>
    </div>
  );
}
