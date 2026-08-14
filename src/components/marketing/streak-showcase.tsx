import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";

export function StreakShowcase() {
  const t = useTranslations("streakShowcase");
  const days = [
    { key: "mon", done: true },
    { key: "tue", done: true },
    { key: "wed", done: true },
    { key: "thu", done: true },
    { key: "fri", done: true },
    { key: "sat", done: false },
    { key: "sun", done: false },
  ] as const;

  return (
    <section className="border-t border-border bg-surface-muted/50 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="mx-auto max-w-sm rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-accent/15">
                <Flame className="size-5 text-brand-accent" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading text-2xl font-bold text-foreground">
                  {t("streakValue")}
                </p>
                <p className="text-xs text-foreground-muted">{t("streakLabel")}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2">
              {days.map((day) => (
                <div key={day.key} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium uppercase text-foreground-muted">
                    {t(`days.${day.key}`)}
                  </span>
                  <span
                    className={
                      day.done
                        ? "flex size-7 items-center justify-center rounded-full bg-brand-turquoise text-brand-turquoise-foreground"
                        : "flex size-7 items-center justify-center rounded-full border border-dashed border-border text-foreground-muted"
                    }
                  >
                    {day.done ? <Flame className="size-3.5" aria-hidden="true" /> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">{t("description")}</p>
        </div>
      </div>
    </section>
  );
}
