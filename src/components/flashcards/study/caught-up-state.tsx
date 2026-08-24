import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function CaughtUpState({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-turquoise/10">
        <GraduationCap className="size-7 text-brand-turquoise" aria-hidden="true" />
      </span>
      <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-foreground-muted">{description}</p>
      <Button asChild variant="outline">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
