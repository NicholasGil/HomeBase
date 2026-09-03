import { AppShell } from "@/components/app-shell";
import { DocumentAccessPanel } from "@/components/document-access-panel";
import { DocumentDenied } from "@/components/document-denied";
import {
  FixtureGrantRow,
  FixtureGrantSheet,
} from "@/components/fixture-grant-controls";
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
import { TextLink } from "@/components/text-link";
import {
  grantSeedDocumentFromForm,
  loadFixtureVault,
  openSeedDocument,
  revokeSeedGrantFromForm,
} from "@/app/actions/documents";
import {
  assertCanRenderWithoutAuth,
  isAuthConfigured,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { vaultGrantsForViewer } from "@/lib/document-access";
import { seedDocumentTitle } from "@/lib/seed-documents";

export const dynamic = "force-dynamic";

async function FixtureDocument({ documentId }: { documentId: string }) {
  const loaded = await openSeedDocument({ documentId });
  if (!loaded.ok) {
    return <DocumentDenied />;
  }
  const { session, grants } = await loadFixtureVault();
  const canGrant = loaded.via === "principal" && session?.role === "buyer";
  const documentGrants = canGrant
    ? vaultGrantsForViewer({ viewer: session, grants }).filter(
        (grant) => grant.documentId === loaded.document.id,
      )
    : [];
  const title = seedDocumentTitle(loaded.document.type);
  return (
    <div className="space-y-6">
      <Card data-testid={`document-open-${loaded.document.type}`}>
        <CardHeader>
          <TextLink
            href="/vault"
            className="-mt-3 justify-self-start"
            data-testid="document-back"
          >
            Back to vault
          </TextLink>
          <Badge variant="outline">{loaded.via}</Badge>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{loaded.document.type}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{loaded.document.extractedSummary}</p>
          <p className="text-xs text-muted-foreground">
            View logged. Transaction {loaded.document.transactionId}.
          </p>
        </CardContent>
      </Card>
      {canGrant ? (
        <DocumentAccessPanel
          action={
            <FixtureGrantSheet
              documentId={loaded.document.id}
              documentTitle={title}
              action={grantSeedDocumentFromForm}
            />
          }
          count={documentGrants.length}
        >
          {documentGrants.map((grant) => (
            <FixtureGrantRow
              key={grant.id}
              grant={grant}
              action={revokeSeedGrantFromForm}
            />
          ))}
        </DocumentAccessPanel>
      ) : null}
    </div>
  );
}

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
    return (
      <AppShell>
        <QueryErrorBoundary message="This document did not load.">
          <FixtureDocument documentId={documentId} />
        </QueryErrorBoundary>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="This document did not load.">
        <LiveDocumentPage documentId={documentId} />
      </QueryErrorBoundary>
    </AppShell>
  );
}
