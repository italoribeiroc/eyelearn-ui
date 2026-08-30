"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/context/auth-context";
import { useRouter } from "@/i18n/navigation";

export function DeleteAccountDialog({ username }: { username: string }) {
  const t = useTranslations("account.deleteAccount");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const { refetch } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirmValue === username;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmValue("");
      setError(null);
    }
  }

  async function onConfirm() {
    if (!matches || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: confirmValue }),
      });

      if (res.ok) {
        // The account is gone and the BFF route already cleared the auth
        // cookies, but useAuthContext()'s client-side state is otherwise
        // unaware of that -- without this, the marketing nav keeps
        // showing "Dashboard" instead of "Log in" after the redirect.
        await refetch();
        router.push("/");
        router.refresh();
        return;
      }

      setError(t("errorGeneric"));
    } catch {
      setError(tErrors("network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          {t("triggerButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("warningText")}</DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="delete-account-confirm">{t("confirmLabel")}</Label>
          <p className="rounded-md bg-muted px-3 py-1.5 font-mono text-sm text-foreground">{username}</p>
          <Input
            id="delete-account-confirm"
            value={confirmValue}
            onChange={(event) => setConfirmValue(event.target.value)}
            placeholder={username}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("cancelButton")}
          </Button>
          <Button type="button" variant="destructive" disabled={!matches || submitting} onClick={onConfirm}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? t("submitting") : t("submitButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
