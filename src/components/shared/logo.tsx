import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 -2 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <defs>
        <linearGradient id="eyelearn-mark" x1="4" y1="8" x2="44" y2="40">
          <stop offset="0" stopColor="var(--color-brand-turquoise)" />
          <stop offset="1" stopColor="var(--color-brand-mint)" />
        </linearGradient>
      </defs>
      <path
        d="M24 12c9.5 0 16.8 6.1 20 12-3.2 5.9-10.5 12-20 12S7.2 29.9 4 24c3.2-5.9 10.5-12 20-12Z"
        fill="url(#eyelearn-mark)"
      />
      <rect x="16.5" y="17" width="15" height="14" rx="4" fill="var(--color-surface)" />
      <rect
        x="19.5"
        y="20.4"
        width="9"
        height="1.8"
        rx="0.9"
        fill="var(--color-brand-turquoise)"
      />
      <rect
        x="19.5"
        y="24"
        width="6"
        height="1.8"
        rx="0.9"
        fill="var(--color-brand-accent)"
      />
      <circle cx="38.5" cy="10.5" r="2.5" fill="var(--color-brand-accent)" />
    </svg>
  );
}

export function Logo({
  className,
  size = "default",
  layout = "inline",
}: {
  className?: string;
  size?: "default" | "lg";
  /**
   * "inline" (default): icon + text sized/centered together as one block --
   * right for a left-aligned nav bar.
   * "centered": the icon is pulled out of flow and floated to the left of
   * the text, so a parent's horizontal centering centers the "Eye Learn"
   * wordmark itself, not the icon+text bounding box (which otherwise reads
   * as off-center since the icon adds width with nothing to balance it).
   */
  layout?: "inline" | "centered";
}) {
  const markSize = size === "lg" ? "size-12" : undefined;
  const textClassName = cn(
    "font-heading font-bold tracking-tight text-foreground",
    size === "lg" ? "text-2xl" : "text-lg",
  );

  if (layout === "centered") {
    return (
      <span className={cn("relative inline-block", className)}>
        <LogoMark
          className={cn(
            "absolute right-full top-1/2 -translate-y-1/2",
            size === "lg" ? "mr-3" : "mr-2",
            markSize,
          )}
        />
        <span className={textClassName}>Eye Learn</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center",
        size === "lg" ? "gap-3" : "gap-2",
        className,
      )}
    >
      <LogoMark className={markSize} />
      <span className={textClassName}>Eye Learn</span>
    </span>
  );
}
