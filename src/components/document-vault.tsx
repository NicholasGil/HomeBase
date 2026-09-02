import Link from "next/link";

import {
  grantSeedDocumentFromForm,
  loadFixtureVault,
  revokeSeedGrantFromForm,
} from "@/app/actions/documents";
import { FolderLock } from "lucide-react";

import { homeActionFor } from "@/components/access-denied-card";
import { EmptyState } from "@/components/empty-state";
import {
  FixtureGrantRow,
  FixtureGrantSheet,
} from "@/components/fixture-grant-controls";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActionNotice } from "@/components/action-notice";
import {
  listFixtureDocuments,
  vaultAuditForViewer,
  vaultGrantsForViewer,
} from "@/lib/document-access";
import { seedDocumentTitle } from "@/lib/seed-documents";
import { tripHeadingClassName } from "@/lib/trip-ui";

export async function FixtureVault({ notice }: { notice?: string }) {
  const { session, grants, audit } = await loadFixtureVault();
  const documents = listFixtureDocuments({ viewer: session, grants });
  const visibleGrants = vaultGrantsForViewer({ viewer: session, grants });
  const visibleAudit = vaultAuditForViewer({
    viewer: session,
    grants,
    audit,
  });
  const canGrant = session?.role === "buyer";

  return (
    <section className="space-y-4" data-testid="document-vault">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className={tripHeadingClassName}>Document vault</h2>
          <p className="text-sm text-muted-foreground">
            Access is decided in a server function. The page does not filter.
          </p>
        </div>
        <Link href="/vault" className="text-sm underline">
          Open vault
        </Link>
      </div>

      <ActionNotice notice={notice} />

      <div className="grid gap-4 md:grid-cols-2">
        {documents.length === 0 ? (
          <EmptyState
            className="md:col-span-2"
            icon={FolderLock}
            title="No documents are open to you."
            description="Documents show up here once they are added to the file or granted to you."
            action={homeActionFor(session?.role)}
          />
        ) : (
          documents.map((document) => {
            const documentGrants = visibleGrants.filter(
              (grant) => grant.documentId === document.id,
            );
            return (
              <Card
                key={document.id}
                data-testid={`vault-doc-${document.type}`}
                className="relative"
              >
                <Link
                  href={`/documents/${document.id}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Open ${seedDocumentTitle(document.type)}`}
                  data-testid={`vault-doc-open-${document.type}`}
                />
                <CardHeader className="pointer-events-none">
                  <CardTitle>{seedDocumentTitle(document.type)}</CardTitle>
                  <CardDescription>{document.type}</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  <Link
                    href={`/documents/${document.id}`}
                    className="text-sm underline"
                  >
                    Open document
                  </Link>
                  {canGrant ? (
                    <div>
                      <FixtureGrantSheet
                        documentId={document.id}
                        documentTitle={seedDocumentTitle(document.type)}
                        action={grantSeedDocumentFromForm}
                      />
                    </div>
                  ) : null}
                  {canGrant && documentGrants.length > 0 ? (
                    <ul className="space-y-2">
                      {documentGrants.map((grant) => (
                        <FixtureGrantRow
                          key={grant.id}
                          grant={grant}
                          action={revokeSeedGrantFromForm}
                        />
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card data-testid="document-audit">
        <CardHeader>
          <CardTitle>Access log</CardTitle>
          <CardDescription>Every view, grant, and revoke.</CardDescription>
        </CardHeader>
        <CardContent>
          {visibleAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No access yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {visibleAudit.map((entry, index) => (
                <li key={`${entry.at}-${index}`}>
                  {entry.action} · {entry.documentId} · {entry.actorClerkId}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
