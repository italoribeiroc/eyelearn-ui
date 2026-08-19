"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type BillingActionButtonProps = {
  /** "checkout" starts a Stripe Checkout session; "portal" opens the Stripe Billing Portal. */
  mode: "checkout" | "portal";
  plan?: "monthly" | "annual";
  /** Portal mode only: deep-links to the plan-picker step instead of the general billing menu. */
  changePlan?: boolean;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  children: React.ReactNode;
};

/**
 * Single component for both billing redirects instead of two near-identical
 * wrappers -- both just POST to a Route Handler and redirect to the URL it
 * returns. See CLAUDE.md for why checkout/portal never happen client-side.
 */
export function BillingActionButton({
  mode,
  plan,
  changePlan,
  variant,
  size,
  className,
  children,
}: BillingActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();
  const t = useTranslations("billing");

  async function handleClick() {
    setIsLoading(true);

    try {
      const endpoint = mode === "checkout" ? "/api/billing/checkout" : "/api/billing/portal";
      const body = mode === "checkout" ? { plan, locale } : { locale, changePlan };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Billing action failed");

      const data = (await response.json()) as { checkoutUrl?: string; portalUrl?: string };
      const redirectUrl = data.checkoutUrl ?? data.portalUrl;
      if (!redirectUrl) throw new Error("No redirect URL returned");

      window.location.href = redirectUrl;
    } catch {
      setIsLoading(false);
      toast.error(t("error"));
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading}
      onClick={handleClick}
    >
      {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </Button>
  );
}
