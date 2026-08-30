import { redirect } from "next/navigation";

import { loadFixturePropertySearch } from "@/app/actions/search";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LivePropertySearch } from "@/components/live-property-search";
import { PropertySearch } from "@/components/property-search";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    saved?: string;
    notice?: string;
    propertyId?: string;
  }>;
}) {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const session = await getTestSession();
  const mode = dashboardRenderMode(process.env, session);
  const params = await searchParams;

  if (mode === "unavailable") {
    throw new ProductionAuthMisconfiguredError();
  }

  if (mode === "login") {
    return (
      <AppShell>
        <FixtureLoginPrompt />
      </AppShell>
    );
  }

  if (mode === "fixture") {
    if (session === null) {
      redirect("/test-login");
    }
    const loaded = await loadFixturePropertySearch(params.q);
    return (
      <AppShell>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Search</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Signed in as {session.name} · {session.role}
        </p>
        <PropertySearch
          denied={!loaded.ok}
          view={loaded.ok ? loaded.view : null}
          savedOnly={params.saved === "1"}
          notice={params.notice}
          noticePropertyId={params.propertyId}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            You cannot open property search.
          </p>
        }
      >
        <LivePropertySearch />
      </QueryErrorBoundary>
    </AppShell>
  );
}
