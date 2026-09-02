import Link from "next/link";

import { ProfileMenu } from "@/components/profile-menu";
import type { AppNavLink, AppNavRole } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

export function AppNavLinks({
  links,
  role,
  viewerName,
  fixtureSignOut,
}: {
  links: AppNavLink[];
  role: AppNavRole;
  viewerName?: string;
  fixtureSignOut?: boolean;
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-3"
      data-testid="app-nav"
      data-nav-role={role}
    >
      <nav aria-label="Primary" className="hidden min-w-0 md:block">
        <ul className="flex flex-nowrap items-center gap-0.5 overflow-x-auto">
          {links.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                href={link.href}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-sage hover:text-sage-foreground",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {viewerName && role !== "guest" ? (
        <ProfileMenu
          name={viewerName}
          role={role}
          fixtureSignOut={fixtureSignOut}
        />
      ) : null}
    </div>
  );
}
