import Link from "next/link";

import { loadSeedTransaction } from "@/app/actions/seed-transaction";
import { getTestSession } from "@/app/actions/test-session";
import {
  AccessDeniedCard,
  homeActionFor,
} from "@/components/access-denied-card";
import { AppShell } from "@/components/app-shell";
import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { LiveTransactionPage } from "@/components/live-transaction-page";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { StageAdvancePanel } from "@/components/stage-advance-panel";
import { assertCanRenderWithoutAuth, isAuthConfigured } from "@/lib/auth-config";
import { seedBuyerNameForTransaction } from "@/lib/seed-dashboard";

export const dynamic = "force-dynamic";

async function FixtureTransaction({ transactionId }: { transactionId: string }) {
  const session = await getTestSession();
  const loaded = await loadSeedTransaction({ transactionId });
  if (!loaded.ok) {
    return (
      <AccessDeniedCard
        title="You cannot open this transaction."
        action={homeActionFor(session?.role)}
      />
    );
  }
  return (
    <>
      {session?.role === "agent" ? (
        <Link href="/agent" className="mb-6 inline-block text-sm underline">
          Back to command center
        </Link>
      ) : null}
      <div className="space-y-10">
        <BuyerDashboardViewPanel
          view={loaded.view}
          buyerName={seedBuyerNameForTransaction(transactionId) ?? undefined}
          eyebrow="Opened by id"
          journeyOrientation="responsive"
        />
        {/* No mutation exists in the fixture preview, so the control renders disabled with that reason. */}
        <StageAdvancePanel view={loaded.view} />
      </div>
    </>
  );
}

export default async function TransactionPage({
  params,
}: PageProps<"/transactions/[transactionId]">) {
  const { transactionId: rawTransactionId } = await params;
  const transactionId = decodeURIComponent(rawTransactionId);

  if (!isAuthConfigured()) {
    assertCanRenderWithoutAuth();
    return (
      <AppShell>
        <QueryErrorBoundary message="This transaction did not load.">
          <FixtureTransaction transactionId={transactionId} />
        </QueryErrorBoundary>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="This transaction did not load.">
        <LiveTransactionPage transactionId={transactionId} />
      </QueryErrorBoundary>
    </AppShell>
  );
}
