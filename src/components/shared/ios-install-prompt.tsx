"use client";

import type { ComponentType, SVGProps } from "react";
import { ChevronDown, Ellipsis, Share, SquarePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo";
import { useIosInstallPrompt } from "@/hooks/use-ios-install-prompt";

const STEPS: { key: "more" | "share" | "showMore" | "addToHome"; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: "more", Icon: Ellipsis },
  { key: "share", Icon: Share },
  { key: "showMore", Icon: ChevronDown },
  { key: "addToHome", Icon: SquarePlus },
];

/**
 * Floating bottom banner telling iPhone Safari visitors how to add the site
 * to their home screen (Safari has no install API to trigger it directly,
 * so the only option is to show the manual steps). Renders nothing for
 * every other browser, for anyone already running the installed home-screen
 * app, and for anyone who has dismissed it -- see useIosInstallPrompt.
 */
export function IosInstallPrompt() {
  const t = useTranslations("installPrompt");
  const [visible, dismiss] = useIosInstallPrompt();

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="relative mx-auto max-w-md rounded-lg border border-border bg-surface p-4 pr-10 shadow-[var(--shadow-soft-lg)]">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={dismiss}
          aria-label={t("close")}
          className="absolute top-2 right-2"
        >
          <X aria-hidden="true" />
        </Button>

        <div className="flex items-center gap-2.5">
          <LogoMark className="size-8 shrink-0" />
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold text-foreground">{t("title")}</p>
            <p className="text-xs text-foreground-muted">{t("description")}</p>
          </div>
        </div>

        <ol className="mt-3 space-y-1.5">
          {STEPS.map(({ key, Icon }, index) => (
            <li key={key} className="flex items-center gap-2.5 text-xs text-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-turquoise/15 text-brand-turquoise">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span>
                <span className="font-semibold">{index + 1}.</span> {t(`steps.${key}`)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
