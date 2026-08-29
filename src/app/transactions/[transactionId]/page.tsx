import { AppShell } from "@/components/app-shell";
import { LiveTransactionPage } from "@/components/live-transaction-page";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { isAuthConfigured } from "@/lib/auth-config";

export default async function TransactionPage({
  params,
}: PageProps<"/transactions/[transactionId]">) {
  const { transactionId } = await params;

  if (!isAuthConfigured()) {
    return (
      <AppShell>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Transaction {transactionId}
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Loading another buyer&apos;s transaction by URL is denied in
            Convex. Buyer A calling <code>dashboard.getById</code> or{" "}
            <code>transactions.get</code> with buyer B&apos;s id throws
            FORBIDDEN. Sign in with Clerk to exercise this route against a live
            backend.
          </p>
        </div>
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
