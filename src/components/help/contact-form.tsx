"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { contactSchema, type ContactFormValues } from "@/lib/validation/contact-schema";

export function ContactForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const t = useTranslations("help.contact");
  const tValidation = useTranslations("help.contact.validation");
  const locale = useLocale();
  const [rootError, setRootError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: defaultName, email: defaultEmail, message: "" },
  });

  const translateMessage = (code?: string) => {
    if (!code) return undefined;
    try {
      return tValidation(code as never);
    } catch {
      return code;
    }
  };

  async function onSubmit(values: ContactFormValues) {
    setRootError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      if (res.status === 429) {
        setRootError(t("errorTooManyRequests"));
      } else {
        setRootError(t("errorGeneric"));
      }
    } catch {
      setRootError(t("errorNetwork"));
    }
  }

  if (submitted) {
    return (
      <Alert variant="success">
        <CheckCircle2 aria-hidden="true" />
        <AlertDescription>
          <span className="font-semibold">{t("successTitle")}</span> {t("successDescription")}
        </AlertDescription>
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
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
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
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage>{translateMessage(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("messageLabel")}</FormLabel>
              <FormControl>
                <Textarea rows={5} placeholder={t("messagePlaceholder")} {...field} />
              </FormControl>
              <FormMessage>{translateMessage(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {form.formState.isSubmitting ? t("submitting") : t("submitButton")}
        </Button>
      </form>
    </Form>
  );
}
