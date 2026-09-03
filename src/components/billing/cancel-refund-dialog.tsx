"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "@/i18n/navigation";

/** Self-serve immediate cancel-and-refund within the 7-day withdrawal
 * window (see the Terms of Service's refund policy). Mirrors
 * DeleteAccountDialog's Dialog + confirm + loading/error shape, but with a
 * plain confirm button rather than a typed-username confirmation -- this
 * is less destructive than full account deletion (the account and its
 * data are untouched), so a lighter confirmation step is proportionate. */
export function CancelRefundDialog({ eligibleUntil }: { eligibleUntil: string }) {
  const t = useTranslations("billing.cancelRefund");
  const tErrors = useTranslations("auth.errors");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(eligibleUntil),
  );

  function onOpenChange(next: boolean) {
    if (submitting) return; // don't let it close mid-request
    setOpen(next);
    if (!next) setError(null);
  }

  async function onConfirm() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/cancel-with-refund", { method: "POST" });

      if (res.ok) {
        toast.success(t("successToast"));
        setOpen(false);
        router.refresh();
        return;
      }

      if (res.status === 400) {
        setError(t("errorWindowExpired"));
      } else {
        setError(t("errorGeneric"));
      }
    } catch {
      setError(tErrors("network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {t("triggerButton", { date: formattedDate })}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("warningText")}</DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("cancelButton")}
          </Button>
          <Button type="button" variant="destructive" disabled={submitting} onClick={onConfirm}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? t("submitting") : t("confirmButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
