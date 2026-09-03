"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link } from "@/i18n/navigation";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/register-schema";
import type { ApiFieldErrors } from "@/lib/api/types";

export function RegisterForm({ plan }: { plan?: string }) {
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const locale = useLocale();
  const [rootError, setRootError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
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
          terms_accepted: values.acceptTerms,
          locale,
          ...(plan ? { plan } : {}),
        }),
      });

      if (res.ok) {
        // Registration no longer logs in -- the account is created
        // inactive and a verification email is sent (see accounts.services
        // .EmailVerificationService on the backend). Login is blocked
        // until that link is clicked.
        setRegisteredEmail(values.email);
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
            ["terms_accepted", "acceptTerms"],
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

  async function onResend() {
    if (!registeredEmail || resending) return;
    setResending(true);

    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, locale }),
      });

      if (res.ok) {
        toast.success(t("resendSuccess"));
      } else if (res.status === 429) {
        toast.error(tErrors("tooManyRequests"));
      } else {
        toast.error(tErrors("generic"));
      }
    } catch {
      toast.error(tErrors("network"));
    } finally {
      setResending(false);
    }
  }

  if (registeredEmail) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          <MailCheck aria-hidden="true" />
          <AlertDescription>{t("checkEmailMessage", { email: registeredEmail })}</AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resending}
          onClick={onResend}
        >
          {resending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {resending ? t("resendSubmitting") : t("resendButton")}
        </Button>
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

        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <FormItem className="flex flex-row items-start gap-2.5 space-y-0">
              <FormControl>
                <Checkbox
                  id="accept-terms"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <div className="space-y-1 leading-snug">
                <FormLabel
                  htmlFor="accept-terms"
                  className="block font-normal text-foreground-muted"
                >
                  {t("acceptTermsPrefix")}{" "}
                  <Link href="/terms" target="_blank" className="text-brand-turquoise underline underline-offset-2">
                    {t("termsLinkLabel")}
                  </Link>{" "}
                  {t("acceptTermsMiddle")}{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-brand-turquoise underline underline-offset-2"
                  >
                    {t("privacyLinkLabel")}
                  </Link>
                </FormLabel>
                <FormMessage>{translateFieldError(fieldState)}</FormMessage>
              </div>
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
