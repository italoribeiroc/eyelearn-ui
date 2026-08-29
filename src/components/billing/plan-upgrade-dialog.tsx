"use client";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Wraps the (Server Component) pricing cards passed as `children` in a
 * modal, so upgrading/switching plans works from wherever
 * SubscriptionSummaryCard is rendered (account page) without a
 * page navigation. See CLAUDE.md for why this replaced a plain link.
 *
 * `title` only feeds the required (but visually hidden) DialogTitle for
 * screen readers -- the pricing cards already render their own visible
 * heading, so showing both would be redundant.
 */
export function PlanUpgradeDialog({
  triggerLabel,
  title,
  children,
}: {
  triggerLabel: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto lg:max-w-4xl xl:max-w-6xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
