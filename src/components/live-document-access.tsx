"use client";

import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";

import { DocumentAccessPanel } from "@/components/document-access-panel";
import { GrantAccessSheet } from "@/components/grant-access-sheet";
import { GrantRow } from "@/components/grant-row";
import { seedDocumentTitle } from "@/lib/seed-documents";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Grant sheet plus one row per grant for a live document. Only mount this for
 * a principal on the document: `listGrants` and `listOrgDirectory` deny anyone
 * else, and the mutations decide who may grant or revoke.
 */
function useLiveGrants(documentId: string, type: string) {
  const id = documentId as Id<"documents">;
  const grants = useQuery(api.documents.listGrants, { documentId: id });
  const directory = useQuery(api.me.listOrgDirectory, {});
  const grant = useMutation(api.documents.grant);
  const revoke = useMutation(api.documents.revoke);

  const sheet: ReactNode =
    directory !== undefined && directory.length > 0 ? (
      <GrantAccessSheet
        documentTitle={seedDocumentTitle(type)}
        parties={directory.map((user) => ({
          id: user.userId,
          name: user.name,
          roleLabel: roleLabel(user.role),
        }))}
        onConfirm={async (choice) => {
          await grant({
            documentId: id,
            granteeId: choice.partyId as Id<"users">,
            scope: choice.scope,
            expiresAt: choice.expiresAt,
          });
        }}
      />
    ) : null;

  const rows: ReactNode[] = (grants ?? []).map((row) => {
    const grantee = directory?.find((user) => user.userId === row.granteeId);
    const name = grantee?.name ?? "party";
    return (
      <GrantRow
        key={row._id}
        label={`Granted to ${name} · ${row.scope}`}
        granteeName={name}
        expiresAt={row.expiresAt}
        revoked={row.revokedAt !== undefined}
        onRevoke={async () => {
          await revoke({ grantId: row._id });
        }}
      />
    );
  });

  return { sheet, rows };
}

/** Inline controls for the vault card. */
export function LiveGrantControls({
  documentId,
  type,
}: {
  documentId: string;
  type: string;
}) {
  const { sheet, rows } = useLiveGrants(documentId, type);
  return (
    <>
      {sheet ? <div>{sheet}</div> : null}
      {rows.length > 0 ? <ul className="space-y-2">{rows}</ul> : null}
    </>
  );
}

/** The "Who has access" card on a live document page. */
export function LiveDocumentAccessPanel({
  documentId,
  type,
}: {
  documentId: string;
  type: string;
}) {
  const { sheet, rows } = useLiveGrants(documentId, type);
  return (
    <DocumentAccessPanel action={sheet} count={rows.length}>
      {rows}
    </DocumentAccessPanel>
  );
}
