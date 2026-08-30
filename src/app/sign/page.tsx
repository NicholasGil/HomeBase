import { redirect } from "next/navigation";

import { loadFixtureSignatureWorkflow } from "@/app/actions/esign";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveSignatureWorkflow } from "@/components/live-signature-workflow";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { SignatureWorkflow } from "@/components/signature-workflow";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function SignPage() {
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
    if (session === null) {
      redirect("/test-login");
    }
    const loaded = await loadFixtureSignatureWorkflow();
    return (
      <AppShell>
        <p className="mb-8 text-sm text-muted-foreground">
          Signed in as {session.name} · {session.role}
        </p>
        <SignatureWorkflow
          denied={!loaded.ok}
          packets={loaded.ok ? loaded.packets : []}
          sections={loaded.ok ? loaded.sections : []}
          flagOn={loaded.ok ? loaded.flagOn : false}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            You cannot open this signature packet.
          </p>
        }
      >
        <LiveSignatureWorkflow />
      </QueryErrorBoundary>
    </AppShell>
  );
}
