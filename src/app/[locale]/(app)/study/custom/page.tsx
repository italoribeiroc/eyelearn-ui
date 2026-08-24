import { getTranslations } from "next-intl/server";
import { CollectionPicker } from "@/components/flashcards/study/collection-picker";
import { listCollections } from "@/lib/flashcards/api";

export default async function CustomStudyPickerPage() {
  const [collections, t] = await Promise.all([listCollections(), getTranslations("study.customPicker")]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("description")}</p>
      </div>
      <CollectionPicker collections={collections} />
    </div>
  );
}
