"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for the auth-gated (app) segment. A page here throws most
 * often because its Server Component data fetch got a 401: the session
 * lapsed mid-navigation and the fetch failed before the layout's
 * redirect-to-login could take effect (they render in parallel).
 *
 * So before showing anything, re-check the session through /api/auth/me,
 * which -- unlike a Server Component render -- can refresh and persist a
 * fresh access token. If the session is genuinely gone, go to /login. Only
 * a real, non-auth error falls through to the retry UI.
 */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("appError");
  const locale = useLocale();
  const loginHref = locale === "pt-BR" ? "/pt-BR/login" : "/login";
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => {
        if (cancelled) return;
        if (res.status === 401) {
          window.location.href = loginHref;
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (!cancelled) setCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loginHref]);

  if (checkingSession) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground-muted" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="text-sm text-foreground-muted">{t("subtitle")}</p>
      <div className="flex gap-3">
        <Button type="button" onClick={reset}>
          {t("retry")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.location.href = loginHref;
          }}
        >
          {t("goToLogin")}
        </Button>
      </div>
    </div>
  );
}
