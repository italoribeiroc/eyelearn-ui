"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

/**
 * Lands here right after register/login/Google auth when the visitor came
 * from a pricing card CTA. Immediately starts a Checkout session and bounces
 * to Stripe -- see CLAUDE.md for the full plan-intent-through-auth flow.
 */
export function CheckoutRedirect({ plan }: { plan: "monthly" | "annual" }) {
  const locale = useLocale();
  const t = useTranslations("billing");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, locale }),
        });

        if (!response.ok) throw new Error("Checkout failed");

        const data = (await response.json()) as { checkoutUrl?: string };
        if (!data.checkoutUrl) throw new Error("No redirect URL returned");

        window.location.href = data.checkoutUrl;
      } catch {
        if (cancelled) return;
        toast.error(t("error"));
        router.replace("/dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Loader2 className="size-8 animate-spin text-brand-turquoise" aria-hidden="true" />
      <p className="text-sm text-foreground-muted">{t("redirecting")}</p>
    </div>
  );
}
