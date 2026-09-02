import { loadFixtureVendorCookies } from "@/app/actions/vendors";
import { getTestSession } from "@/app/actions/test-session";
import { homeActionFor } from "@/components/access-denied-card";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveVendorPortal } from "@/components/live-vendor-portal";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  VendorPortalDenied,
  VendorPortalView,
} from "@/components/vendor-portal";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { loadSeedPortalForViewer } from "@/lib/vendor-access";

export const dynamic = "force-dynamic";

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const session = await getTestSession();
  const mode = dashboardRenderMode(process.env, session);

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
    const cookies = await loadFixtureVendorCookies();
    const loaded = loadSeedPortalForViewer(session, {
      expired: cookies.expired,
      state: cookies.state,
    });
    if (!loaded.ok) {
      return (
        <AppShell>
          <VendorPortalDenied action={homeActionFor(session?.role)} />
        </AppShell>
      );
    }
    const params = await searchParams;
    return (
      <AppShell>
        <VendorPortalView
          vendorName={session?.role === "vendor" ? session.name : "Vendor"}
          assignments={loaded.assignments}
          state={loaded.state}
          expired={loaded.expired}
          notice={params.notice}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="The vendor portal did not load.">
        <LiveVendorPortal />
      </QueryErrorBoundary>
    </AppShell>
  );
}
