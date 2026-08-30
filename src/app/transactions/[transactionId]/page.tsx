import { loadSeedTransaction } from "@/app/actions/seed-transaction";
import { AppShell } from "@/components/app-shell";
import { BuyerDashboardViewPanel } from "@/components/buyer-dashboard-view";
import { LiveTransactionPage } from "@/components/live-transaction-page";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { assertCanRenderWithoutAuth, isAuthConfigured } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function TransactionPage({
  params,
}: PageProps<"/transactions/[transactionId]">) {
  const { transactionId } = await params;

  if (!isAuthConfigured()) {
    assertCanRenderWithoutAuth();
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
        <BuyerDashboardViewPanel
          view={loaded.view}
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
