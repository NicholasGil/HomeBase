import Link from "next/link";

import { loadSeedTransaction } from "@/app/actions/seed-transaction";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { LiveTransactionPage } from "@/components/live-transaction-page";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { assertCanRenderWithoutAuth, isAuthConfigured } from "@/lib/auth-config";
import { seedBuyerNameForTransaction } from "@/lib/seed-dashboard";

export const dynamic = "force-dynamic";

export default async function TransactionPage({
  params,
}: PageProps<"/transactions/[transactionId]">) {
  const { transactionId: rawTransactionId } = await params;
  const transactionId = decodeURIComponent(rawTransactionId);

  if (!isAuthConfigured()) {
    assertCanRenderWithoutAuth();
    const session = await getTestSession();
    const loaded = await loadSeedTransaction({ transactionId });
    if (!loaded.ok) {
      return (
        <AppShell>
          <p className="text-sm text-muted-foreground">
            You cannot open this transaction.
          </p>
        </AppShell>
      );
    }
    return (
      <AppShell>
        {session?.role === "agent" ? (
          <Link href="/agent" className="mb-6 inline-block text-sm underline">
            Back to command center
          </Link>
        ) : null}
        <BuyerDashboardViewPanel
          view={loaded.view}
          buyerName={seedBuyerNameForTransaction(transactionId) ?? undefined}
          eyebrow="Opened by id"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            You cannot open this transaction.
          </p>
        }
      >
        <LiveTransactionPage transactionId={transactionId} />
      </QueryErrorBoundary>
    </AppShell>
  );
}
