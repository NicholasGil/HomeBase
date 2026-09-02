"use client";

import { GrantAccessSheet } from "@/components/grant-access-sheet";
import { GrantRow } from "@/components/grant-row";
import type { FixtureGrant } from "@/lib/document-access";
import { SEED_LENDER } from "@/lib/seed-documents";

type FormAction = (formData: FormData) => Promise<void>;

/*
  Fixture mode keeps its server actions: the sheet and the confirm just build
  the same FormData the old inline forms posted. The action still decides who
  may grant or revoke and writes the audit entry.
*/

const FIXTURE_PARTIES = [
  { id: SEED_LENDER.clerkId, name: SEED_LENDER.name, roleLabel: "Lender" },
];

export function FixtureGrantSheet({
  documentId,
  documentTitle,
  action,
}: {
  documentId: string;
  documentTitle: string;
  action: FormAction;
}) {
  return (
    <GrantAccessSheet
      documentTitle={documentTitle}
      parties={FIXTURE_PARTIES}
      onConfirm={async () => {
        const formData = new FormData();
        formData.set("documentId", documentId);
        await action(formData);
      }}
    />
  );
}

export function FixtureGrantRow({
  grant,
  action,
}: {
  grant: FixtureGrant;
  action: FormAction;
}) {
  return (
    <GrantRow
      label={`Granted to lender · ${grant.scope}`}
      granteeName={SEED_LENDER.name}
      expiresAt={grant.expiresAt}
      revoked={grant.revokedAt !== undefined}
      onRevoke={async () => {
        const formData = new FormData();
        formData.set("grantId", grant.id);
        await action(formData);
      }}
    />
  );
}
