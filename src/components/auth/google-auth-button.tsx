import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.88c2.27-2.09 3.54-5.17 3.54-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-2.98c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.31v3.07C3.28 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.34a7.2 7.2 0 0 1 0-4.68V6.59H1.31a12 12 0 0 0 0 10.82l4-3.07Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.28 2.7 1.31 6.59l4 3.07c.94-2.82 3.58-4.91 6.69-4.91Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({ hideDivider = false }: { hideDivider?: boolean }) {
  const t = useTranslations("auth.common");

  return (
    <div className="space-y-5">
      {hideDivider ? null : (
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t("orDivider")}</span>
          <Separator className="flex-1" />
        </div>
      )}

      <Button asChild type="button" variant="outline" size="lg" className="w-full">
        {/* Intentionally a plain <a>, not next/link's Link: this must be a
            full navigation to a Route Handler that redirects to Google, not
            a client-side route. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/auth/google" data-icon="inline-start">
          <GoogleIcon />
          {t("continueWithGoogle")}
        </a>
      </Button>
    </div>
  );
}
