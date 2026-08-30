"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "@/i18n/navigation";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/forgot-password-schema";

type Status = "verifying" | "error";

export function VerifyEmailStatus() {
  const t = useTranslations("auth.verifyEmail");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const plan = searchParams.get("plan");

  const [status, setStatus] = useState<Status>(!uid || !token ? "error" : "verifying");
  const [resendSubmitted, setResendSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (!uid || !token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, token }),
        });

        if (cancelled) return;

        if (res.ok) {
          const loginPath = plan ? `/login?verified=success&plan=${plan}` : "/login?verified=success";
          router.replace(loginPath);
          return;
        }

        setStatus("error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, token]);

  const translateMessage = (code?: string) => {
    if (!code) return undefined;
    try {
      return tValidation(code as never);
    } catch {
      return code;
    }
  };

  async function onResendSubmit(values: ForgotPasswordFormValues) {
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (res.ok) {
        setResendSubmitted(true);
      }
    } catch {
      // Network hiccup on a best-effort resend -- the generic error copy
      // already shown covers this, no need for a second error surface.
    }
  }

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="size-8 animate-spin text-brand-turquoise" aria-hidden="true" />
        <p className="text-sm text-foreground-muted">{t("verifying")}</p>
      </div>
    );
  }

  if (resendSubmitted) {
    return (
      <Alert>
        <AlertDescription>{t("resendSuccess")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <Alert variant="destructive">
        <AlertDescription>{t("invalidTokenError")}</AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onResendSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("resendEmailLabel")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage>{translateMessage(fieldState.error?.message)}</FormMessage>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {form.formState.isSubmitting ? t("resendSubmitting") : t("resendButton")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
