import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

/** Superseded by the per-collection study flow at /flashcards/[collectionId]/study. */
export default async function StudyRedirectPage() {
  const locale = await getLocale();
  redirect({ href: "/flashcards", locale });
}
