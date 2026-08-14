import { getTranslations } from "next-intl/server";
import { BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function StudyPlaceholderPage() {
  const t = await getTranslations("study");

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-surface py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-turquoise/10">
        <BookOpenCheck className="size-7 text-brand-turquoise" aria-hidden="true" />
      </span>
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="max-w-sm text-sm text-foreground-muted">{t("description")}</p>
      <Button asChild variant="outline">
        <Link href="/dashboard">{t("backToDashboard")}</Link>
      </Button>
    </div>
  );
}
