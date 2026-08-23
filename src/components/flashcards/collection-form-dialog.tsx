"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import type { ApiFieldErrors, Collection } from "@/lib/api/types";

/** Create a new collection (optionally as a subcollection of `parentId`), or edit an existing one. */
export function CollectionFormDialog({
  mode,
  collection,
  parentId,
  trigger,
}: {
  mode: "create" | "edit";
  collection?: Collection;
  parentId?: number;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("flashcards.collectionForm");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetAndClose(next: boolean) {
    setOpen(next);
    if (!next) {
      setName(collection?.name ?? "");
      setDescription(collection?.description ?? "");
      setError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const endpoint =
        mode === "create"
          ? "/api/flashcards/collections"
          : `/api/flashcards/collections/${collection!.id}`;

      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "create"
            ? { name: name.trim(), description: description.trim(), parent: parentId ?? null }
            : { name: name.trim(), description: description.trim() },
        ),
      });

      if (res.ok) {
        toast.success(mode === "create" ? t("createSuccess") : t("updateSuccess"));
        setOpen(false);
        router.refresh();
        return;
      }

      const body = (await res.json().catch(() => null)) as ApiFieldErrors | null;
      setError(body?.name?.[0] ?? body?.detail ?? tErrors("generic"));
    } catch {
      setError(tErrors("network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("createTitle") : t("editTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="collection-name">{t("nameLabel")}</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
              required
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="collection-description">{t("descriptionLabel")}</Label>
            <Textarea
              id="collection-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
