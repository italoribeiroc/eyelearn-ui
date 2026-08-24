import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * One prominent primary action (Material Design's "high emphasis" button)
 * plus lightweight text links for secondary actions, instead of several
 * equally-weighted pill buttons -- keeps the card compact and the actions
 * visually ranked instead of competing for attention.
 */
export function StartStudyingCta({
  dailyDueCount = 0,
  dailyTargetTotal = 0,
}: {
  dailyDueCount?: number;
  dailyTargetTotal?: number;
}) {
  const t = useTranslations("dashboard");
  const hasGoalToday = dailyDueCount > 0;
  const completedToday = Math.max(dailyTargetTotal - dailyDueCount, 0);
  const progressPercent = dailyTargetTotal > 0 ? Math.min((completedToday / dailyTargetTotal) * 100, 100) : 0;

  return (
    <div className="rounded-lg border border-border bg-gradient-to-br from-brand-turquoise/10 to-brand-mint/10 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent/15">
            <Sparkles className="size-5 text-brand-accent" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-lg font-semibold text-foreground">
              {hasGoalToday ? t("ctaDailyTitle") : t("ctaTitle")}
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              {hasGoalToday ? t("ctaDailyDescription", { count: dailyDueCount }) : t("ctaDescription")}
            </p>

            {dailyTargetTotal > 0 ? (
              <div className="mt-3 max-w-xs space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand-turquoise transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-foreground-muted">
                  {t("ctaProgress", { completed: completedToday, total: dailyTargetTotal })}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <Button asChild size="lg">
            <Link href={hasGoalToday ? "/study" : "/flashcards"}>
              {hasGoalToday ? t("ctaDailyButton") : t("ctaButton")}
            </Link>
          </Button>
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm">
            {hasGoalToday ? (
              <Link href="/flashcards" className="text-foreground-muted hover:text-foreground hover:underline">
                {t("ctaButton")}
              </Link>
            ) : null}
            <Link href="/study/custom" className="text-foreground-muted hover:text-foreground hover:underline">
              {t("ctaCustomButton")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
