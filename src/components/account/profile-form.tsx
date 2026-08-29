"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import { useAuthContext } from "@/context/auth-context";
import { useRouter } from "@/i18n/navigation";
import type { ApiFieldErrors, EyeLearnUser } from "@/lib/api/types";
import { profileSchema, type ProfileFormValues } from "@/lib/validation/profile-schema";

export function ProfileForm({ user }: { user: EyeLearnUser }) {
  const t = useTranslations("account.profile");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const { refetch } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  // Local copy of what's displayed, separate from `user` (a server-rendered
  // prop that only updates after router.refresh() completes) so the
  // read-only view reflects a successful save immediately.
  const [profile, setProfile] = useState({
    name: user.first_name,
    username: user.username,
    email: user.email,
  });
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });

  /**
   * Zod's own validators (profileSchema) set short keys ("usernameMin",
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

  function startEditing() {
    form.reset(profile);
    setRootError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    form.reset(profile);
    setRootError(null);
    setIsEditing(false);
  }

  async function onSubmit(values: ProfileFormValues) {
    setRootError(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: values.name,
          username: values.username,
          email: values.email,
        }),
      });

      if (res.ok) {
        setProfile(values);
        setIsEditing(false);
        toast.success(t("success"));
        await refetch();
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

  if (!isEditing) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-bold text-foreground">{t("title")}</h2>
          <Button type="button" variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="size-3.5" aria-hidden="true" />
            {t("edit")}
          </Button>
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-foreground-muted">{t("nameLabel")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">{t("usernameLabel")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{profile.username}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">{t("emailLabel")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{profile.email}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]"
        noValidate
      >
        <h2 className="font-heading text-lg font-bold text-foreground">{t("title")}</h2>

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
                <Input autoComplete="given-name" {...field} />
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
                <Input autoComplete="username" {...field} />
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
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage>{translateFieldError(fieldState)}</FormMessage>
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {form.formState.isSubmitting ? t("submitting") : t("submit")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={cancelEditing}
            disabled={form.formState.isSubmitting}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
