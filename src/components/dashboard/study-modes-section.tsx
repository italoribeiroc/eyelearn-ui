import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FolderPlus,
  PartyPopper,
  Shuffle,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { GoalIntroDialog } from "@/components/dashboard/goal-intro-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type HeroState = "noCollections" | "goalDue" | "goalDone" | "noGoal";

/**
 * The dashboard's "how do I study now?" area, in two tiers:
 *
 *  1. A hero card for today's goal, the most prominent thing on the page, with
 *     one distinct state for each situation a user can be in (no collections
 *     yet, cards due today, goal finished today, no goal set) -- these used to
 *     all collapse into the same "Go to flashcards" card.
 *  2. Three equal, fully clickable tiles for the other ways to study, so each
 *     mode is discoverable at a glance instead of a small muted text link.
 */
export function StudyModesSection({
  dailyDueCount,
  dailyTargetTotal,
  hasActiveGoals,
  collectionCount,
  lastExamPercent,
}: {
  dailyDueCount: number;
  dailyTargetTotal: number;
  hasActiveGoals: boolean;
  collectionCount: number;
  /** Score of the most recent finished exam, if any. */
  lastExamPercent: number | null;
}) {
  const t = useTranslations("dashboard.studyModes");

  const hero: HeroState =
    collectionCount === 0
      ? "noCollections"
      : dailyDueCount > 0
        ? "goalDue"
        : hasActiveGoals
          ? "goalDone"
          : "noGoal";

  const completedToday = Math.max(dailyTargetTotal - dailyDueCount, 0);
  const progressPercent = dailyTargetTotal > 0 ? Math.min((completedToday / dailyTargetTotal) * 100, 100) : 0;
  const locked = collectionCount === 0;

  return (
    <section aria-labelledby="study-modes-heading" className="space-y-5">
      <h2 id="study-modes-heading" className="sr-only">
        {t("heading")}
      </h2>

      <div className="rounded-lg border border-border bg-gradient-to-br from-brand-turquoise/10 to-brand-mint/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                hero === "goalDone" ? "bg-success/15" : "bg-brand-accent/15",
              )}
            >
              {hero === "goalDone" ? (
                <PartyPopper className="size-5 text-success" aria-hidden="true" />
              ) : hero === "noCollections" ? (
                <FolderPlus className="size-5 text-brand-accent" aria-hidden="true" />
              ) : hero === "noGoal" ? (
                <Target className="size-5 text-brand-accent" aria-hidden="true" />
              ) : (
                <Sparkles className="size-5 text-brand-accent" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold text-foreground">{t(`hero.${hero}.title`)}</p>
              <p className="mt-1 text-sm text-foreground-muted">
                {t(`hero.${hero}.description`, { count: dailyDueCount })}
              </p>

              {dailyTargetTotal > 0 && (hero === "goalDue" || hero === "goalDone") ? (
                <div className="mt-3 max-w-xs space-y-1">
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(progressPercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t("progressLabel")}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        hero === "goalDone" ? "bg-success" : "bg-brand-turquoise",
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-foreground-muted">
                    {t("progress", { completed: completedToday, total: dailyTargetTotal })}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0">
            {hero === "noCollections" ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/flashcards">{t("hero.noCollections.button")}</Link>
              </Button>
            ) : hero === "goalDue" ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/study">{t("hero.goalDue.button")}</Link>
              </Button>
            ) : hero === "goalDone" ? (
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/study/custom">{t("hero.goalDone.button")}</Link>
              </Button>
            ) : (
              <GoalIntroDialog
                trigger={
                  <Button type="button" size="lg" className="w-full sm:w-auto">
                    {t("hero.noGoal.button")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">{t("otherWaysHeading")}</h3>
          {locked ? <p className="mt-0.5 text-sm text-foreground-muted">{t("lockedHint")}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ModeTile
            href="/study/custom"
            icon={Shuffle}
            title={t("custom.title")}
            description={t("custom.description")}
            disabled={locked}
          />
          <ModeTile
            href="/exam"
            icon={ClipboardCheck}
            title={t("exam.title")}
            description={t("exam.description")}
            badge={lastExamPercent !== null ? t("exam.last", { percent: lastExamPercent }) : undefined}
            disabled={locked}
          />
          <ModeTile
            href="/flashcards"
            icon={BookOpen}
            title={t("collection.title")}
            description={t("collection.description")}
            disabled={locked}
          />
        </div>
      </div>
    </section>
  );
}

function ModeTile({
  href,
  icon: Icon,
  title,
  description,
  badge,
  disabled,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-turquoise/10">
        <Icon className="size-5 text-brand-turquoise" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-heading text-sm font-semibold text-foreground">{title}</span>
          {badge ? (
            <span className="rounded-full bg-brand-turquoise/10 px-2 py-0.5 text-[11px] font-semibold text-brand-turquoise">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs text-foreground-muted">{description}</span>
      </span>
    </>
  );

  const base = "flex min-h-16 items-start gap-3 rounded-lg border border-border bg-surface p-4";

  if (disabled) {
    return (
      <div aria-disabled="true" className={cn(base, "opacity-50")}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        "shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-brand-turquoise/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      {content}
    </Link>
  );
}
