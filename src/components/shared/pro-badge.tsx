import { cn } from "@/lib/utils";

/** Small pill marking a subscribed (Pro) account -- shown next to the logo, account plan card, etc. */
export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-brand-accent/30 bg-brand-accent/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-accent uppercase",
        className,
      )}
    >
      Pro
    </span>
  );
}
