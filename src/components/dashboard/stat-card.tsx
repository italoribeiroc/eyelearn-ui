import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Shared shell for dashboard metrics. When `comingSoon` is set, the card
 * renders a dashed, muted empty state instead of a number -- this app must
 * never present a fabricated number as real user data. If `action` is also
 * given, the empty state renders that instead of a dead-end badge -- the
 * caller supplies a fully-built trigger (a link, a button opening a dialog,
 * etc.) for metrics that are opt-in per collection rather than something the
 * backend simply doesn't support yet.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  comingSoon,
  comingSoonLabel,
  action,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  comingSoon?: boolean;
  comingSoonLabel?: string;
  action?: React.ReactNode;
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
        {comingSoon && !action ? (
          <Badge variant="outline" className="text-foreground-muted">
            {comingSoonLabel}
          </Badge>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-foreground-muted">{label}</p>
      {value ? (
        <p className="mt-1 font-heading text-2xl font-bold text-foreground">{value}</p>
      ) : action ? (
        <div className="mt-2">{action}</div>
      ) : null}
    </div>
  );
}
