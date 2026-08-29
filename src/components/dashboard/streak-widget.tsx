"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { isoDate, monthRangeUTC } from "@/lib/flashcards/date-utils";
import type { StreakCalendarDay } from "@/lib/api/types";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** Monday-first weekday index (0=Mon..6=Sun) for a "YYYY-MM-DD" UTC date string. */
function weekdayIndex(date: string): number {
  const utcDay = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  return (utcDay + 6) % 7;
}

function DayDot({
  day,
  topLabel,
  isToday,
}: {
  day: StreakCalendarDay;
  topLabel: string;
  isToday: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={cn(
          "text-[10px] font-medium uppercase",
          isToday ? "text-brand-turquoise" : "text-foreground-muted",
        )}
      >
        {topLabel}
      </span>
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full",
          day.studied
            ? "bg-brand-turquoise text-brand-turquoise-foreground"
            : "border border-dashed border-border text-foreground-muted",
          isToday && !day.studied && "border-solid border-brand-turquoise text-brand-turquoise",
          isToday && "ring-2 ring-brand-turquoise/40 ring-offset-2 ring-offset-surface",
        )}
      >
        {day.studied ? <Flame className="size-3.5" aria-hidden="true" /> : null}
      </span>
    </div>
  );
}

/** Leading `null` placeholders so the 1st of the month lands in its correct weekday column. */
function withLeadingBlanks(days: StreakCalendarDay[]): (StreakCalendarDay | null)[] {
  if (days.length === 0) return [];
  const blanks: null[] = Array(weekdayIndex(days[0].date)).fill(null);
  return [...blanks, ...days];
}

export function StreakWidget({
  streak,
  initialWeek,
}: {
  streak: number;
  initialWeek: StreakCalendarDay[];
}) {
  const t = useTranslations("dashboard.streakWidget");
  const tDays = useTranslations("common.days");
  const locale = useLocale();
  const currentMonthStart = monthRangeUTC().start;
  const [viewedMonth, setViewedMonth] = useState<Date>(currentMonthStart);
  const [month, setMonth] = useState<StreakCalendarDay[] | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const todayIso = isoDate(new Date());
  const monthCells = withLeadingBlanks(month ?? []);
  const isCurrentMonth = viewedMonth.getTime() === currentMonthStart.getTime();
  const rawMonthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(viewedMonth);
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1);

  async function loadMonth(target: Date) {
    setLoadingMonth(true);
    try {
      const { start, end } = monthRangeUTC(target);
      const res = await fetch(`/api/flashcards/streak?start=${isoDate(start)}&end=${isoDate(end)}`);
      if (res.ok) {
        const data = (await res.json()) as { days: StreakCalendarDay[] };
        setMonth(data.days);
      }
    } finally {
      setLoadingMonth(false);
    }
  }

  function openMonthTab() {
    if (month || loadingMonth) return;
    loadMonth(viewedMonth);
  }

  function changeMonth(deltaMonths: number) {
    if (loadingMonth) return;
    const next = new Date(Date.UTC(viewedMonth.getUTCFullYear(), viewedMonth.getUTCMonth() + deltaMonths, 1));
    if (next.getTime() > currentMonthStart.getTime()) return;
    setViewedMonth(next);
    setMonth(null);
    loadMonth(next);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <Tabs defaultValue="week" onValueChange={(value) => value === "month" && openMonthTab()}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-accent/15">
              <Flame className="size-4.5 text-brand-accent" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-lg font-bold text-foreground">
                {t("streakValue", { count: streak })}
              </p>
              <p className="text-xs text-foreground-muted">{t("streakLabel")}</p>
            </div>
          </div>
          <TabsList>
            <TabsTrigger value="week">{t("weekTab")}</TabsTrigger>
            <TabsTrigger value="month">{t("monthTab")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="week">
          <div className="mt-6 grid grid-cols-7 gap-2">
            {initialWeek.map((day, index) => (
              <DayDot
                key={day.date}
                day={day}
                topLabel={tDays(WEEKDAY_KEYS[index])}
                isToday={day.date === todayIso}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="month">
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => changeMonth(-1)}
              disabled={loadingMonth}
              aria-label={t("previousMonth")}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <p className="min-w-32 text-center font-heading text-sm font-bold text-foreground">
              {monthLabel}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => changeMonth(1)}
              disabled={loadingMonth || isCurrentMonth}
              aria-label={t("nextMonth")}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {loadingMonth && !month ? (
            <p className="mt-4 text-center text-sm text-foreground-muted">{t("loadingMonth")}</p>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAY_KEYS.map((key) => (
                  <span
                    key={key}
                    className="text-center text-[10px] font-medium uppercase text-foreground-muted"
                  >
                    {tDays(key)}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthCells.map((day, index) =>
                  day ? (
                    <DayDot key={day.date} day={day} topLabel={String(Number(day.date.slice(-2)))} isToday={day.date === todayIso} />
                  ) : (
                    <div key={`blank-${index}`} className="size-7" />
                  ),
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
