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
  hideWordmarkOnMobile = false,
}: {
  className?: string;
  size?: "default" | "lg";
  /**
   * "inline" (default): icon beside text, right for a left-aligned nav bar.
   * "centered": icon mark only (no wordmark) -- used where the icon needs
   * to read as centered on its own (e.g. above the auth cards), since
   * icon-beside-text can't be centered as a block without the icon's extra
   * width throwing the text off-center. "Eye Learn" is still present for
   * screen readers via sr-only text.
   */
  layout?: "inline" | "centered";
  /**
   * Collapses to the icon mark only below `sm`, where a crowded nav (many
   * icon buttons alongside the logo) leaves too little width for the
   * wordmark and it wraps to a second line. "Eye Learn" stays present for
   * screen readers via sr-only text.
   */
  hideWordmarkOnMobile?: boolean;
}) {
  const markSize = size === "lg" ? "size-12" : undefined;
  const textClassName = cn(
    "font-heading font-bold leading-none tracking-tight text-foreground",
    size === "lg" ? "text-2xl" : "text-lg",
    hideWordmarkOnMobile && "hidden sm:inline",
  );

  if (layout === "centered") {
    return (
      <span className={cn("inline-flex", className)}>
        <LogoMark className={markSize} />
        <span className="sr-only">Eye Learn</span>
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
      {hideWordmarkOnMobile ? <span className="sr-only sm:hidden">Eye Learn</span> : null}
    </span>
  );
}
