import type { ReactNode } from "react";
import Link from "next/link";
import { Inbox, type LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/**
 * Instructive empty state: what is (not) here, and exactly one next action.
 * `action` is rendered as a 44px link so it is a real tap target on 375.
 */
export function EmptyState({
  testId,
  icon: Icon = Inbox,
  title,
  description,
  action,
  children,
  className,
}: {
  testId?: string;
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  /** Alternative to `action` for a client-side control (still one action). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Empty
      data-testid={testId}
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/60 py-8",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-muted-foreground">
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className="leading-6">
            {description}
          </EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? (
        <EmptyContent>
          <Link
            href={action.href}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-11 px-4",
            )}
          >
            {action.label}
          </Link>
        </EmptyContent>
      ) : children ? (
        <EmptyContent>{children}</EmptyContent>
      ) : null}
    </Empty>
  );
}
