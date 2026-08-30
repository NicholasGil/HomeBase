import Link from "next/link";
import { Search } from "lucide-react";

import { getTestSession } from "@/app/actions/test-session";
import { AppNavLinks } from "@/components/app-nav";
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
          {context.role === "buyer" ? (
            <Link
              href="/search"
              className="hidden min-w-0 max-w-xs flex-1 items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm ring-1 ring-black/8 sm:flex"
            >
              <Search className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">Search homes</span>
            </Link>
          ) : null}
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {nav}
            {live && session === null ? (
              <LiveAppNav />
            ) : (
              <AppNavLinks
                links={links}
                role={context.role}
                viewerName={context.name}
              />
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
    </div>
  );
}
