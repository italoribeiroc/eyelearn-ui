import { useTranslations } from "next-intl";

export function WelcomeHeader({ username }: { username: string }) {
  const t = useTranslations("dashboard");

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground">
        {t("welcome", { username })}
      </h1>
      <p className="mt-2 text-foreground-muted">{t("subtitle")}</p>
    </div>
  );
}
