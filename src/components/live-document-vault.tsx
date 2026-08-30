"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { seedDocumentTitle } from "@/lib/seed-documents";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export function LiveDocumentVault() {
  const documents = useQuery(api.documents.listMine, {});
  const session = useQuery(api.me.getSession, {});

  if (documents === undefined || session === undefined) {
    return <p className="text-sm text-muted-foreground">Loading vault…</p>;
  }

  return (
    <section className="space-y-4" data-testid="document-vault">
      <h1 className="text-3xl font-semibold tracking-tight">Document vault</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents are visible to you.
          </p>
        ) : (
          documents.map((document) => (
            <LiveDocumentCard
              key={document._id}
              documentId={document._id}
              type={document.type}
              canManage={session.role !== "vendor"}
            />
          ))
        )}
      </div>
    </section>
  );
}

function LiveDocumentCard({
  documentId,
  type,
  canManage,
}: {
  documentId: string;
  type: string;
  canManage: boolean;
}) {
  const grants = useQuery(
    api.documents.listGrants,
    canManage ? { documentId: documentId as Id<"documents"> } : "skip",
  );
  const grant = useMutation(api.documents.grant);
  const revoke = useMutation(api.documents.revoke);
  const users = useQuery(api.me.listOrgDirectory, canManage ? {} : "skip");

  const lender = users?.find((user) => user.role === "vendor");

  return (
    <Card data-testid={`vault-doc-${type}`}>
      <CardHeader>
        <CardTitle>{seedDocumentTitle(type)}</CardTitle>
        <CardDescription>{type}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href={`/documents/${documentId}`} className="text-sm underline">
          Open document
        </Link>
        {canManage && lender ? (
          <Button
            variant="outline"
            onClick={() => {
              void grant({
                documentId: documentId as Id<"documents">,
                granteeId: lender.userId,
                scope: "view",
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
              });
            }}
          >
            Grant to {lender.name}
          </Button>
        ) : null}
        {grants?.map((row) => (
          <div key={row._id} className="flex items-center justify-between gap-2">
            <Badge variant={row.revokedAt === undefined ? "secondary" : "outline"}>
              {row.revokedAt === undefined ? row.scope : "Revoked"}
            </Badge>
            {row.revokedAt === undefined ? (
              <Button
                variant="destructive"
                onClick={() => {
                  void revoke({ grantId: row._id });
                }}
              >
                Revoke
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
