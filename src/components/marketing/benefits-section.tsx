import { useTranslations } from "next-intl";
import {
  BookOpenCheck,
  CalendarCheck,
  Layers,
  LineChart,
  Route,
  ScanEye,
  Sparkles,
  Timer,
} from "lucide-react";

const ICONS = [
  ScanEye,
  Sparkles,
  CalendarCheck,
  LineChart,
  Route,
  Layers,
  BookOpenCheck,
  Timer,
] as const;

export function BenefitsSection() {
  const t = useTranslations("benefits");
  const items = [0, 1, 2, 3, 4, 5, 6, 7] as const;

  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = ICONS[item];
            return (
              <div
                key={item}
                className="rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
              >
                <Icon className="size-6 text-brand-turquoise" aria-hidden="true" />
                <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                  {t(`items.${item}.title`)}
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  {t(`items.${item}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
