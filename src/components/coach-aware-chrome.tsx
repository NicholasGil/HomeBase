"use client";

import { usePathname } from "next/navigation";

import {
  ConciergeSheet,
  type ConciergeScope,
} from "@/components/concierge-sheet";
import type { ConciergeAvailability } from "@/lib/concierge-availability";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { BUYER_COACH_HOME } from "@/lib/buyer-shell";
import type { AppNavLink } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

export function CoachAwareMain({
  children,
  conciergeScope,
  conciergeAvailability = "ready",
}: {
  children: React.ReactNode;
  conciergeScope: ConciergeScope | null;
  conciergeAvailability?: ConciergeAvailability;
}) {
  const pathname = usePathname();
  const coachHome =
    pathname === BUYER_COACH_HOME || pathname.startsWith(`${BUYER_COACH_HOME}/`);
  const fabScope = coachHome ? null : conciergeScope;

  return (
    <>
      <main
        className={cn(
          "mx-auto max-w-5xl px-5 py-10",
          fabScope !== null &&
            "pb-[calc(6rem+var(--fab-dock-clearance))]",
          coachHome &&
            "py-6 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+1.5rem)] md:py-8 md:pb-8",
        )}
      >
        {children}
      </main>
      {fabScope ? (
        <ConciergeSheet
          scope={fabScope}
          availability={conciergeAvailability}
        />
      ) : null}
    </>
  );
}

export function CoachAwareMobileTabBar({ links }: { links: AppNavLink[] }) {
  return <MobileTabBar links={links} />;
}
