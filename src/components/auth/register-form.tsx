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
import { useRouter } from "@/i18n/navigation";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/register-schema";
import type { ApiFieldErrors } from "@/lib/api/types";

export function RegisterForm({ plan }: { plan?: string }) {
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", username: "", email: "", password: "", confirmPassword: "" },
  });

  /**
   * Zod's own validators (registerSchema) set short keys ("usernameMin",
   * "required", ...) as the error message, translated here. Django's field
   * errors (set below with type: "server") are already human-readable
   * English sentences and must be rendered as-is, never run through
   * tValidation -- there's no matching key for them and next-intl's
   * fallback for a missing key is "auth.validation.<the raw sentence>".
   */
  const translateFieldError = (fieldState: { error?: { type?: string; message?: string } }) => {
    const { error } = fieldState;
    if (!error?.message) return undefined;
    if (error.type === "server") return error.message;
    try {
      return tValidation(error.message as never);
    } catch {
      return error.message;
    }
  };

  async function onSubmit(values: RegisterFormValues) {
    setRootError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: values.name,
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      });

      if (res.ok) {
        router.push(plan ? `/dashboard?startCheckout=${plan}` : "/dashboard");
        router.refresh();
        return;
      }

      const body = (await res.json().catch(() => null)) as ApiFieldErrors | null;

      if (body) {
        let mappedAnyField = false;
        // Django's field errors are keyed by the serializer field name
        // (first_name), which maps onto this form's "name" field.
        (
          [
            ["first_name", "name"],
            ["username", "username"],
            ["email", "email"],
            ["password", "password"],
          ] as const
        ).forEach(([serverField, formField]) => {
          const messages = body[serverField];
          if (messages?.length) {
            form.setError(formField, { type: "server", message: messages[0] });
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
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input autoComplete="given-name" placeholder={t("namePlaceholder")} autoFocus {...field} />
              </FormControl>
              <FormMessage>{translateFieldError(fieldState)}</FormMessage>
            </FormItem>
          )}
        />

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
              <FormMessage>{translateFieldError(fieldState)}</FormMessage>
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
              <FormMessage>{translateFieldError(fieldState)}</FormMessage>
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
              <FormMessage>{translateFieldError(fieldState)}</FormMessage>
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
              <FormMessage>{translateFieldError(fieldState)}</FormMessage>
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
