import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
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

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-bold tracking-tight text-foreground">
        Eye Learn
      </span>
    </span>
  );
}
