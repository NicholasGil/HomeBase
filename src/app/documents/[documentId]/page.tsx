import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LiveDocumentPage } from "@/components/live-document-page";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { openSeedDocument } from "@/app/actions/documents";
import {
  assertCanRenderWithoutAuth,
  isAuthConfigured,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { seedDocumentTitle } from "@/lib/seed-documents";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: PageProps<"/documents/[documentId]">) {
  const { documentId: rawDocumentId } = await params;
  const documentId = decodeURIComponent(rawDocumentId);

  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  if (!isAuthConfigured()) {
    assertCanRenderWithoutAuth();
    const loaded = await openSeedDocument({ documentId });
    if (!loaded.ok) {
      return (
        <AppShell>
          <p
            data-testid="document-denied"
            className="text-sm text-muted-foreground"
          >
            You cannot open this document.
          </p>
        </AppShell>
      );
    }
    return (
      <AppShell>
        <Card data-testid={`document-open-${loaded.document.type}`}>
          <CardHeader>
            <Link href="/vault" className="text-sm underline" data-testid="document-back">
              Back to vault
            </Link>
            <Badge variant="outline">{loaded.via}</Badge>
            <CardTitle>{seedDocumentTitle(loaded.document.type)}</CardTitle>
            <CardDescription>{loaded.document.type}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{loaded.document.extractedSummary}</p>
            <p className="text-xs text-muted-foreground">
              View logged. Transaction {loaded.document.transactionId}.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p
            data-testid="document-denied"
            className="text-sm text-muted-foreground"
          >
            You cannot open this document.
          </p>
        }
      >
        <LiveDocumentPage documentId={documentId} />
      </QueryErrorBoundary>
    </AppShell>
  );
}
