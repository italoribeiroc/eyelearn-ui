"use client";

// Drives AI flashcard generation independently of whichever page is
// mounted. There's no server-side job queue in this app (Vercel serverless
// + Django, no Celery/RQ) -- see flashcards/services.py's batching comments
// -- so "keep generating while the user does something else" has to be a
// client-orchestrated loop, same as the review page's old per-batch polling
// was. The difference is *where* that loop lives: this provider is mounted
// once in (app)/layout.tsx, which persists across client-side navigation
// between any authenticated page, instead of living inside the review
// page's own component (which stopped polling the moment it unmounted).
// A generation only keeps running as long as some (app) page stays open in
// the tab; a hard reload or closing the tab still pauses it, but it always
// resumes correctly (see AiDraftReview) because each batch is persisted to
// the draft row server-side as it lands, not just held in memory here.
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AiGenerationDraft, AiGenerationDraftCard } from "@/lib/api/types";
import { usePathname, useRouter } from "@/i18n/navigation";

type GenerationRecord = {
  draftId: number;
  collectionId: number;
  cards: AiGenerationDraftCard[];
  targetCount: number;
};

type AiGenerationContextValue = {
  generations: Record<number, GenerationRecord>;
  startGeneration: (draft: Pick<AiGenerationDraft, "id" | "collection" | "cards" | "target_count" | "status">) => void;
};

const AiGenerationContext = createContext<AiGenerationContextValue | null>(null);

export function AiGenerationProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("flashcards.aiGenerate");
  const router = useRouter();
  const pathname = usePathname();
  const [generations, setGenerations] = useState<Record<number, GenerationRecord>>({});
  // Tracks which drafts have an in-flight polling loop so a second
  // startGeneration call (e.g. the review page's own mount-time call,
  // right after the dialog already started one) is a safe no-op instead of
  // racing two loops against the same draft.
  const runningRef = useRef<Set<number>>(new Set());

  const startGeneration = useCallback(
    (draft: Pick<AiGenerationDraft, "id" | "collection" | "cards" | "target_count" | "status">) => {
      if (draft.status !== "pending") return;
      if (draft.cards.length >= draft.target_count) return; // nothing left to generate
      if (runningRef.current.has(draft.id)) return; // already running
      runningRef.current.add(draft.id);

      setGenerations((prev) => ({
        ...prev,
        [draft.id]: {
          draftId: draft.id,
          collectionId: draft.collection,
          cards: draft.cards,
          targetCount: draft.target_count,
        },
      }));

      (async () => {
        let currentCards = draft.cards;
        let failed = false;

        while (currentCards.length < draft.target_count) {
          try {
            const res = await fetch(`/api/flashcards/ai-generate/${draft.id}/generate-next-batch`, {
              method: "POST",
            });
            if (!res.ok) {
              failed = true;
              break;
            }
            const updated = (await res.json()) as AiGenerationDraft;
            currentCards = updated.cards;
            setGenerations((prev) => {
              const existing = prev[draft.id];
              if (!existing) return prev; // no longer tracked (shouldn't happen, defensive)
              return { ...prev, [draft.id]: { ...existing, cards: updated.cards } };
            });
          } catch {
            failed = true;
            break;
          }
        }

        runningRef.current.delete(draft.id);
        setGenerations((prev) => {
          const next = { ...prev };
          delete next[draft.id];
          return next;
        });

        if (failed) {
          toast.error(t("errorGenerationFailed"));
        } else {
          toast.success(t("generationCompleteToast", { count: currentCards.length }), {
            action: {
              label: t("generationCompleteAction"),
              onClick: () => router.push(`/flashcards/${draft.collection}/ai-generate/${draft.id}`),
            },
          });
        }
      })();
    },
    [router, t],
  );

  // The review page for a draft already shows its own inline progress, so
  // suppress the floating badges while looking at any /ai-generate/ page to
  // avoid showing duplicate "generating" UI for the one the user can already see.
  const onReviewPage = pathname.includes("/ai-generate/");
  const visibleGenerations = onReviewPage ? [] : Object.values(generations);

  return (
    <AiGenerationContext.Provider value={{ generations, startGeneration }}>
      {children}
      {visibleGenerations.length > 0 ? (
        <div className="fixed bottom-4 left-4 z-30 flex flex-col gap-2">
          {visibleGenerations.map((gen) => (
            <button
              key={gen.draftId}
              type="button"
              onClick={() => router.push(`/flashcards/${gen.collectionId}/ai-generate/${gen.draftId}`)}
              className="flex items-center gap-2 rounded-full border border-border bg-surface/95 px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-soft-lg)] backdrop-blur-md transition-colors hover:bg-surface-muted"
            >
              <Loader2 className="size-3.5 animate-spin text-brand-accent" aria-hidden="true" />
              {t("generatingBadge", { done: gen.cards.length, total: gen.targetCount })}
            </button>
          ))}
        </div>
      ) : null}
    </AiGenerationContext.Provider>
  );
}

export function useAiGeneration(draftId: number) {
  const ctx = useContext(AiGenerationContext);
  if (!ctx) throw new Error("useAiGeneration must be used within an AiGenerationProvider");
  return ctx.generations[draftId] ?? null;
}

export function useAiGenerationActions() {
  const ctx = useContext(AiGenerationContext);
  if (!ctx) throw new Error("useAiGenerationActions must be used within an AiGenerationProvider");
  return { startGeneration: ctx.startGeneration };
}
