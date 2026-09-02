"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";

import { FolderLock } from "lucide-react";

import { homeActionFor } from "@/components/access-denied-card";
import { EmptyState } from "@/components/empty-state";
import { VaultSectionSkeleton } from "@/components/route-skeletons";
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
    return <VaultSectionSkeleton />;
  }

  return (
    <section className="space-y-4" data-testid="document-vault">
      <h1 className="text-3xl font-semibold tracking-tight">Document vault</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {documents.length === 0 ? (
          <EmptyState
            className="md:col-span-2"
            icon={FolderLock}
            title="No documents are open to you."
            description="Documents show up here once they are added to the file or granted to you."
            action={homeActionFor(session.role)}
          />
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
    <Card data-testid={`vault-doc-${type}`} className="relative">
      <Link
        href={`/documents/${documentId}`}
        className="absolute inset-0 z-0"
        aria-label={`Open ${seedDocumentTitle(type)}`}
        data-testid={`vault-doc-open-${type}`}
      />
      <CardHeader className="pointer-events-none">
        <CardTitle>{seedDocumentTitle(type)}</CardTitle>
        <CardDescription>{type}</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 space-y-3">
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
