import type { ReactNode } from "react";
import { ArrowLeft, CircleHelp, type LucideIcon, Mail, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ContactForm } from "@/components/help/contact-form";
import { OnboardingGuideDialog } from "@/components/onboarding/onboarding-guide-dialog";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

const FAQ_ITEM_KEYS = [
  "whatIsEyeLearn",
  "creatingCards",
  "cardTypes",
  "ratingButtons",
  "studyGoals",
  "streaks",
  "freeLimit",
  "deletingAccount",
] as const;

const sectionCardClass =
  "rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8";

/** Icon-badge + title pair reused by every section, echoing the same
 * rounded-icon pattern the onboarding dialog and goal-intro dialog use, so
 * each block of the page reads as its own clearly anchored section instead
 * of a wall of same-weight headings. */
function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-turquoise/10">
        <Icon className="size-5 text-brand-turquoise" aria-hidden="true" />
      </span>
      <h2 className="font-heading text-xl font-bold text-foreground">{children}</h2>
    </div>
  );
}

export default async function HelpPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("help")]);

  // The (app) layout already redirects unauthenticated visitors to /login,
  // so `user` is guaranteed here -- this is just a type-narrowing guard.
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("backToDashboard")}
          </Link>
        </Button>
        <h1 className="mt-2 font-heading text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-base text-foreground-muted">{t("subtitle")}</p>
      </div>

      <div className={sectionCardClass}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeading icon={Sparkles}>{t("howItWorksTitle")}</SectionHeading>
          <OnboardingGuideDialog
            trigger={
              <Button type="button" variant="outline">
                {t("replayGuideButton")}
              </Button>
            }
          />
        </div>
      </div>

      <div className={sectionCardClass}>
        <SectionHeading icon={CircleHelp}>{t("faq.title")}</SectionHeading>
        <Accordion type="single" collapsible className="mt-4">
          {FAQ_ITEM_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="py-4 text-base font-semibold">
                {t(`faq.items.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <p className="text-base leading-relaxed text-foreground-muted">
                  {t(`faq.items.${key}.answer`)}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className={sectionCardClass}>
        <SectionHeading icon={Mail}>{t("contact.title")}</SectionHeading>
        <p className="mt-2 text-base text-foreground-muted">{t("contact.description")}</p>
        <div className="mt-6">
          <ContactForm defaultName={user.first_name || user.username} defaultEmail={user.email} />
        </div>
      </div>
    </div>
  );
}
