import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Shared shell for dashboard metrics. When `comingSoon` is set, the card
 * renders a dashed, muted "coming soon" state instead of a number --
 * there is no backend data source for streaks/goals/progress yet, and
 * this app must never present a fabricated number as real user data.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  comingSoon,
  comingSoonLabel,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  comingSoon?: boolean;
  comingSoonLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface p-5",
        comingSoon
          ? "border-dashed border-border/80"
          : "border-border shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            comingSoon ? "bg-surface-muted" : "bg-brand-turquoise/10",
          )}
        >
          <Icon
            className={cn(
              "size-4.5",
              comingSoon ? "text-foreground-muted" : "text-brand-turquoise",
            )}
            aria-hidden="true"
          />
        </span>
        {comingSoon ? (
          <Badge variant="outline" className="text-foreground-muted">
            {comingSoonLabel}
          </Badge>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-foreground-muted">{label}</p>
      {value ? (
        <p className="mt-1 font-heading text-2xl font-bold text-foreground">{value}</p>
      ) : null}
    </div>
  );
}
