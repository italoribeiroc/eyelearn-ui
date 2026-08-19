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
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useRouter } from "@/i18n/navigation";
import { loginSchema, type LoginFormValues } from "@/lib/validation/login-schema";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? undefined;
  const [rootError, setRootError] = useState<string | null>(
    searchParams.get("error") === "google_auth_failed" ? tErrors("googleAuthFailed") : null,
  );

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const translateMessage = (code?: string) => {
    if (!code) return undefined;
    try {
      return tValidation(code as never);
    } catch {
      return code;
    }
  };

  async function onSubmit(values: LoginFormValues) {
    setRootError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        router.push(plan ? `/dashboard?startCheckout=${plan}` : "/dashboard");
        router.refresh();
        return;
      }

      if (res.status === 401) {
        setRootError(tErrors("invalidCredentials"));
      } else {
        setRootError(tErrors("generic"));
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
                <Input autoComplete="username" autoFocus {...field} />
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
                <Input type="password" autoComplete="current-password" {...field} />
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

        <GoogleAuthButton plan={plan} />
      </form>
    </Form>
  );
}
