"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiFieldErrors, CollectionGoalProgress } from "@/lib/api/types";

/**
 * Self-contained goal editor, meant to be the sole content of
 * CollectionGoalDialog -- saves/removes the goal on its own, independent of
 * any other dialog state.
 */
export function CollectionGoalSection({
  collectionId,
  open,
}: {
  collectionId: number;
  open: boolean;
}) {
  const t = useTranslations("flashcards.goal");
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<CollectionGoalProgress | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Fetch-on-open: syncs the goal editor with server state whenever the
    // dialog opens or the target collection changes -- no non-effect alternative.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetch(`/api/flashcards/collections/${collectionId}/goal`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setGoal(null);
          setTargetDate("");
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as CollectionGoalProgress;
          setGoal(data);
          setTargetDate(data.target_date);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, collectionId]);

  async function handleSave() {
    if (!targetDate) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/flashcards/collections/${collectionId}/goal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_date: targetDate }),
      });

      if (res.ok) {
        const data = (await res.json()) as CollectionGoalProgress;
        setGoal(data);
        toast.success(goal ? t("updateSuccess") : t("saveSuccess"));
        return;
      }

      const body = (await res.json().catch(() => null)) as ApiFieldErrors | null;
      setError(body?.target_date?.[0] ?? body?.detail ?? t("saveError"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/flashcards/collections/${collectionId}/goal`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setGoal(null);
        setTargetDate("");
        toast.success(t("removeSuccess"));
        return;
      }
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-foreground-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {goal ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
          <span>{t("progressSummary", { mastered: goal.mastered, total: goal.total })}</span>
          <Badge variant={goal.overdue ? "destructive" : "outline"}>
            {goal.overdue ? t("overdueBadge") : t("todayTargetBadge", { count: goal.today_target })}
          </Badge>
        </div>
      ) : (
        <p className="text-sm text-foreground-muted">{t("noGoalSet")}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="collection-goal-date">{t("dateLabel")}</Label>
        <Input
          id="collection-goal-date"
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={saving || !targetDate}
          onClick={handleSave}
          className="w-full sm:w-auto"
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {goal ? t("update") : t("save")}
        </Button>
        {goal ? (
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={handleRemove}
            className="w-full sm:w-auto"
          >
            {t("remove")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
