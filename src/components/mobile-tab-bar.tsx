"use client";

import {
  Briefcase,
  FolderLock,
  House,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
  Route,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppNavLink } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

const TAB_ICONS: ReadonlyArray<readonly [prefix: string, icon: LucideIcon]> = [
  ["/dashboard", House],
  ["/search", Search],
  ["/tours", Route],
  ["/vault", FolderLock],
  ["/agent", LayoutDashboard],
  ["/vendor", Briefcase],
  ["/homeownership", KeyRound],
];

function iconFor(href: string): LucideIcon {
  const match = TAB_ICONS.find(
    ([prefix]) => href === prefix || href.startsWith(`${prefix}/`),
  );
  return match ? match[1] : LayoutGrid;
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Fixed bottom tab bar for viewports below `md`. Mirrors the header pills
 * (same `navLinksFor()` output) so the two never disagree. Renders a spacer
 * so page content is never hidden under the fixed bar.
 */
export function MobileTabBar({ links }: { links: AppNavLink[] }) {
  const pathname = usePathname();

  if (links.length === 0) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        className="h-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] md:hidden"
      />
      <nav
        aria-label="Primary tabs"
        data-testid="app-tab-bar"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-sand/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex h-(--tab-bar-height) max-w-5xl items-stretch px-2">
          {links.map((link) => {
            const Icon = iconFor(link.href);
            const active = isActive(pathname, link.href);
            return (
              <li key={`${link.href}-${link.label}`} className="min-w-0 flex-1">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 h-full min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium leading-none transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      active ? "bg-sage text-sage-foreground" : "",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="max-w-full truncate">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
