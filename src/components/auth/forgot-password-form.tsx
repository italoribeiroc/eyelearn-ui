"use client";

import { useState } from "react";
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
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/forgot-password-schema";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const locale = useLocale();
  const [rootError, setRootError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const translateMessage = (code?: string) => {
    if (!code) return undefined;
    try {
      return tValidation(code as never);
    } catch {
      return code;
    }
  };

  async function onSubmit(values: ForgotPasswordFormValues) {
    setRootError(null);

    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      if (res.status === 429) {
        setRootError(tErrors("tooManyRequests"));
      } else {
        setRootError(tErrors("generic"));
      }
    } catch {
      setRootError(tErrors("network"));
    }
  }

  if (submitted) {
    return (
      <Alert>
        <AlertDescription>{t("successMessage")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {rootError ? (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("emailLabel")}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" autoFocus {...field} />
              </FormControl>
              <FormMessage>{translateMessage(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {form.formState.isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Form>
  );
}
