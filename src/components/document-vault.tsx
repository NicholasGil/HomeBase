import Link from "next/link";

import {
  grantSeedDocumentFromForm,
  loadFixtureVault,
  revokeSeedGrantFromForm,
} from "@/app/actions/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listFixtureDocuments } from "@/lib/document-access";
import { seedDocumentTitle } from "@/lib/seed-documents";
import { tripHeadingClassName } from "@/lib/trip-ui";

export async function FixtureVault() {
  const { session, grants, audit } = await loadFixtureVault();
  const documents = listFixtureDocuments({ viewer: session, grants });
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

      <div className="grid gap-4 md:grid-cols-2">
        {documents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No documents</CardTitle>
              <CardDescription>
                Nothing granted to this viewer on this file.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          documents.map((document) => {
            const documentGrants = grants.filter(
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
                    <form action={grantSeedDocumentFromForm}>
                      <input type="hidden" name="documentId" value={document.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        name="grant"
                      >
                        Grant to Jordan Hale
                      </Button>
                    </form>
                  ) : null}
                  {canGrant
                    ? documentGrants.map((grant) => (
                        <form action={revokeSeedGrantFromForm} key={grant.id}>
                          <input type="hidden" name="grantId" value={grant.id} />
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant={
                                grant.revokedAt === undefined
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {grant.revokedAt === undefined
                                ? `Granted to lender · ${grant.scope}`
                                : "Revoked"}
                            </Badge>
                            {grant.revokedAt === undefined ? (
                              <Button type="submit" variant="destructive">
                                Revoke
                              </Button>
                            ) : null}
                          </div>
                        </form>
                      ))
                    : null}
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
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No access yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {audit.map((entry, index) => (
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
