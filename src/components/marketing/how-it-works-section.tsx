import { useTranslations } from "next-intl";

export function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const steps = [0, 1, 2] as const;

  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">{t("subtitle")}</p>
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step}
              className="relative rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
            >
              <span className="font-heading text-sm font-bold text-brand-accent">
                {t("stepLabel", { number: step + 1 })}
              </span>
              <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                {t(`steps.${step}.title`)}
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">
                {t(`steps.${step}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
