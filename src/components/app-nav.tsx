import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { AppNavLink, AppNavRole } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

export function AppNavLinks({
  links,
  role,
  viewerName,
}: {
  links: AppNavLink[];
  role: AppNavRole;
  viewerName?: string;
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-3"
      data-testid="app-nav"
      data-nav-role={role}
    >
      <nav aria-label="Primary" className="min-w-0">
        <ul className="flex flex-nowrap items-center gap-0.5 overflow-x-auto">
          {links.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                href={link.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {viewerName ? (
        <span
          aria-hidden
          className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-medium text-background sm:flex"
        >
          {viewerName.slice(0, 1)}
        </span>
      ) : null}
    </div>
  );
}
