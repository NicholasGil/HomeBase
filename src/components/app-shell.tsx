import Link from "next/link";

import { getTestSession } from "@/app/actions/test-session";
import { AppNavLinks } from "@/components/app-nav";
import {
  ConciergeSheet,
  type ConciergeScope,
} from "@/components/concierge-sheet";
import { HeaderSearchHomes } from "@/components/header-search";
import { LiveAppNav, LiveMobileTabBar } from "@/components/live-app-nav";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import {
  navContextFromFixtureSession,
  navLinksFor,
  wordmarkHrefFor,
} from "@/lib/app-nav";
import { isAuthConfigured } from "@/lib/auth-config";
import { seedDashboardForBuyer } from "@/lib/seed-dashboard";
import type { TestBuyerSession } from "@/lib/test-session";

/*
  The concierge is scoped to one transaction, so the sheet header names the
  file it can talk about. Only buyer sessions get a scope; agents, vendors,
  and guests never receive the FAB or the sheet tree.
*/
function conciergeScopeFor(session: TestBuyerSession): ConciergeScope {
  const view = seedDashboardForBuyer(session.clerkId);
  const address = view.propertyAddress;
  return {
    address: address
      ? `${address.line1}, ${address.city}`
      : "No property on this file yet",
    stage: view.where.label,
  };
}

export async function AppShell({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav?: React.ReactNode;
}) {
  const session = await getTestSession();
  const live = isAuthConfigured();
  const context = navContextFromFixtureSession(session);
  const links = navLinksFor(context);
  const liveNav = live && session === null;
  const conciergeScope =
    session !== null && session.role === "buyer"
      ? conciergeScopeFor(session)
      : null;

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-20 border-b border-sand/80 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-2">
          <Link
            href={wordmarkHrefFor(context.role)}
            className="inline-flex min-h-11 shrink-0 items-center text-body font-semibold tracking-tight"
          >
            HomeBase
          </Link>
          {context.role === "buyer" ? <HeaderSearchHomes /> : null}
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {nav}
            {liveNav ? (
              <LiveAppNav />
            ) : (
              <AppNavLinks
                links={links}
                role={context.role}
                viewerName={context.name}
                fixtureSignOut={session !== null}
              />
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
      {liveNav ? <LiveMobileTabBar /> : <MobileTabBar links={links} />}
      {conciergeScope ? <ConciergeSheet scope={conciergeScope} /> : null}
    </div>
  );
}
