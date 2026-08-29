"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
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
import { useRouter, Link } from "@/i18n/navigation";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validation/reset-password-schema";

export function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [rootError, setRootError] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState(!uid || !token);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const translateMessage = (code?: string) => {
    if (!code) return undefined;
    try {
      return tValidation(code as never);
    } catch {
      return code;
    }
  };

  async function onSubmit(values: ResetPasswordFormValues) {
    setRootError(null);

    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: values.newPassword }),
      });

      if (res.ok) {
        router.push("/login?reset=success");
        return;
      }

      if (res.status === 400) {
        setInvalidToken(true);
      } else if (res.status === 429) {
        setRootError(tErrors("tooManyRequests"));
      } else {
        setRootError(tErrors("generic"));
      }
    } catch {
      setRootError(tErrors("network"));
    }
  }

  if (invalidToken) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{t("invalidTokenError")}</AlertDescription>
        </Alert>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-brand-turquoise hover:underline"
        >
          {t("requestNewLinkLink")}
        </Link>
      </div>
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
          name="newPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("newPasswordLabel")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" autoFocus {...field} />
              </FormControl>
              <FormMessage>{translateMessage(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("confirmPasswordLabel")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
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
