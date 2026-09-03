"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import { FolderLock } from "lucide-react";

import { homeActionFor } from "@/components/access-denied-card";
import { EmptyState } from "@/components/empty-state";
import { LiveGrantControls } from "@/components/live-document-access";
import { VaultSectionSkeleton } from "@/components/route-skeletons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { seedDocumentTitle } from "@/lib/seed-documents";
import { api } from "../../convex/_generated/api";

export function LiveDocumentVault() {
  const documents = useQuery(api.documents.listMine, {});
  const session = useQuery(api.me.getSession, {});

  if (documents === undefined || session === undefined) {
    return <VaultSectionSkeleton />;
  }

  return (
    <section className="space-y-4" data-testid="document-vault">
      <h1 className="text-h1 font-semibold tracking-tight">Document vault</h1>
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
        {canManage ? (
          <LiveGrantControls documentId={documentId} type={type} />
        ) : null}
      </CardContent>
    </Card>
  );
}
