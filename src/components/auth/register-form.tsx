"use client";

import { useState } from "react";
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
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useRouter } from "@/i18n/navigation";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/register-schema";
import type { ApiFieldErrors } from "@/lib/api/types";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const translateMessage = (code?: string) => {
    if (!code) return undefined;
    try {
      return tValidation(code as never);
    } catch {
      return code;
    }
  };

  async function onSubmit(values: RegisterFormValues) {
    setRootError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const body = (await res.json().catch(() => null)) as ApiFieldErrors | null;

      if (body) {
        let mappedAnyField = false;
        (["username", "email", "password"] as const).forEach((field) => {
          const messages = body[field];
          if (messages?.length) {
            form.setError(field, { message: messages[0] });
            mappedAnyField = true;
          }
        });

        if (!mappedAnyField) {
          setRootError(body.detail ?? tErrors("generic"));
        }
      } else {
        setRootError(tErrors("network"));
      }
    } catch {
      setRootError(tErrors("network"));
    }
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
          name="username"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("usernameLabel")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  placeholder={t("usernamePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage>{translateMessage(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("emailLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage>{translateMessage(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("passwordLabel")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
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

        <GoogleAuthButton />
      </form>
    </Form>
  );
}
