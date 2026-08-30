import Link from "next/link";

import { getTestSession } from "@/app/actions/test-session";
import { AppNavLinks } from "@/components/app-nav";
import { HeaderSearchHomes } from "@/components/header-search";
import { LiveAppNav } from "@/components/live-app-nav";
import {
  navContextFromFixtureSession,
  navLinksFor,
  wordmarkHrefFor,
} from "@/lib/app-nav";
import { isAuthConfigured } from "@/lib/auth-config";

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

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-20 border-b border-sand/80 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
          <Link
            href={wordmarkHrefFor(context.role)}
            className="shrink-0 text-[15px] font-semibold tracking-tight"
          >
            HomeBase
          </Link>
          {context.role === "buyer" ? <HeaderSearchHomes /> : null}
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {nav}
            {live && session === null ? (
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
    </div>
  );
}
