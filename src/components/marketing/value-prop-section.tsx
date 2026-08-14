import { useTranslations } from "next-intl";
import { BrainCircuit, Eye, Repeat } from "lucide-react";

const ICONS = [Eye, BrainCircuit, Repeat] as const;

export function ValuePropSection() {
  const t = useTranslations("valueProp");
  const items = [0, 1, 2] as const;

  return (
    <section className="border-t border-border bg-surface-muted/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {items.map((item) => {
            const Icon = ICONS[item];
            return (
              <div key={item} className="text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-turquoise/10">
                  <Icon className="size-7 text-brand-turquoise" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
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
