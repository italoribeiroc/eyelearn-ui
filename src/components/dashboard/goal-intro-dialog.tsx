"use client";

import { CalendarClock, Target, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";

/** Explains how per-collection study goals work before sending the user off to set one. */
export function GoalIntroDialog({ trigger }: { trigger: React.ReactNode }) {
  const t = useTranslations("dashboard.goalIntro");

  const benefits = [
    { icon: CalendarClock, text: t("benefit1") },
    { icon: TrendingUp, text: t("benefit2") },
    { icon: Target, text: t("benefit3") },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-turquoise/10">
              <Target className="size-5 text-brand-turquoise" aria-hidden="true" />
            </span>
            <DialogTitle className="font-heading text-xl font-bold text-foreground">
              {t("title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm">{t("description")}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {benefits.map(({ icon: Icon, text }, index) => (
            <li key={index} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-turquoise/10">
                <Icon className="size-4 text-brand-turquoise" aria-hidden="true" />
              </span>
              <span className="text-sm text-foreground-muted">{text}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-foreground-muted">{t("howTo")}</p>

        <DialogFooter>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/flashcards">{t("cta")}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
