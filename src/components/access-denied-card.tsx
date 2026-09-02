import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { type AppNavRole, wordmarkHrefFor } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

export type AccessDeniedAction = { href: string; label: string };

/** The viewer's own home as a way back. Says nothing about what was refused. */
export function homeActionFor(
  role: AppNavRole | undefined,
): AccessDeniedAction {
  const href = wordmarkHrefFor(role ?? "guest");
  switch (role) {
    case "buyer":
      return { href, label: "Back to your file" };
    case "agent":
    case "broker":
    case "admin":
      return { href, label: "Back to the command center" };
    case "vendor":
      return { href, label: "Back to the vendor portal" };
    default:
      return { href, label: "Back to HomeBase" };
  }
}

/**
 * One denied surface for every "the server said no" case. The copy is a
 * single neutral sentence: it never says whether the thing exists, who owns
 * it, or why the viewer was refused. The optional action is a way back, not
 * a hint about what was behind the door.
 */
export function AccessDeniedCard({
  testId,
  title,
  action,
  className,
}: {
  testId?: string;
  title: string;
  action?: AccessDeniedAction;
  className?: string;
}) {
  return (
    <Empty
      data-testid={testId}
      className={cn(
        "rounded-[14px] bg-card py-10 ring-1 ring-black/6",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-muted-foreground">
          <LockKeyhole aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
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
      ) : null}
    </Empty>
  );
}
