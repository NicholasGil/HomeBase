import { isGrantActive } from "../../convex/lib/documentAccess";
import {
  isSeedDocumentId,
  SEED_DOCUMENTS,
  SEED_LENDER,
  type SeedDocument,
} from "@/lib/seed-documents";

export const DOCUMENT_GRANTS_COOKIE = "hb_doc_grants";
export const DOCUMENT_AUDIT_COOKIE = "hb_doc_audit";

export type FixtureGrant = {
  id: string;
  documentId: string;
  granteeClerkId: string;
  scope: "view" | "download";
  expiresAt: number;
  revokedAt?: number;
  grantedBy: string;
};

export type FixtureAuditEntry = {
  actorClerkId: string;
  action: string;
  documentId: string;
  at: number;
};

export type FixtureViewer = {
  clerkId: string;
  role: "buyer" | "vendor" | "agent" | "broker" | "admin";
  transactionId?: string;
};

export function parseFixtureGrants(value: string | undefined): FixtureGrant[] {
  if (value === undefined || value.length === 0) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isFixtureGrant);
  } catch {
    return [];
  }
}

function isFixtureGrant(value: unknown): value is FixtureGrant {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.documentId === "string" &&
    typeof row.granteeClerkId === "string" &&
    (row.scope === "view" || row.scope === "download") &&
    typeof row.expiresAt === "number" &&
    typeof row.grantedBy === "string"
  );
}

export function parseFixtureAudit(
  value: string | undefined,
): FixtureAuditEntry[] {
  if (value === undefined || value.length === 0) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as FixtureAuditEntry[];
  } catch {
    return [];
  }
}

export function isDocumentPrincipal(
  viewer: FixtureViewer,
  document: SeedDocument,
) {
  if (viewer.role === "broker" || viewer.role === "admin") {
    return true;
  }
  if (viewer.role === "agent") {
    return viewer.transactionId === document.transactionId;
  }
  return (
    viewer.role === "buyer" && viewer.transactionId === document.transactionId
  );
}

export function resolveFixtureDocument(input: {
  viewer: FixtureViewer | null;
  documentId: string;
  grants: FixtureGrant[];
  now?: number;
}):
  | { ok: true; document: SeedDocument; via: "principal" | "grant" }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  if (input.viewer === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (!isSeedDocumentId(input.documentId)) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const document = SEED_DOCUMENTS[input.documentId];
  if (isDocumentPrincipal(input.viewer, document)) {
    return { ok: true, document, via: "principal" };
  }
  const now = input.now ?? Date.now();
  const grant = input.grants.find(
    (row) =>
      row.documentId === input.documentId &&
      row.granteeClerkId === input.viewer?.clerkId &&
      isGrantActive(row, now),
  );
  if (grant === undefined) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return { ok: true, document, via: "grant" };
}

export type ListedSeedDocument = Omit<SeedDocument, "extractedSummary">;

export function listFixtureDocuments(input: {
  viewer: FixtureViewer | null;
  grants: FixtureGrant[];
  now?: number;
}): ListedSeedDocument[] {
  if (input.viewer === null) {
    return [];
  }
  const now = input.now ?? Date.now();
  return Object.values(SEED_DOCUMENTS)
    .filter((document) => {
      if (isDocumentPrincipal(input.viewer as FixtureViewer, document)) {
        return true;
      }
      return input.grants.some(
        (grant) =>
          grant.documentId === document.id &&
          grant.granteeClerkId === input.viewer?.clerkId &&
          isGrantActive(grant, now),
      );
    })
    .map(({ extractedSummary: _extractedSummary, ...listed }) => listed);
}

export function grantFixtureDocument(input: {
  viewer: FixtureViewer | null;
  documentId: string;
  granteeClerkId: string;
  grants: FixtureGrant[];
  now?: number;
}):
  | { ok: true; grants: FixtureGrant[] }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  const resolved = resolveFixtureDocument({
    viewer: input.viewer,
    documentId: input.documentId,
    grants: input.grants,
    now: input.now,
  });
  if (!resolved.ok) {
    return resolved;
  }
  if (resolved.via !== "principal" || input.viewer === null) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (input.granteeClerkId !== SEED_LENDER.clerkId) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const now = input.now ?? Date.now();
  const next: FixtureGrant = {
    id: `grant:${input.documentId}:${input.granteeClerkId}:${now}`,
    documentId: input.documentId,
    granteeClerkId: input.granteeClerkId,
    scope: "view",
    expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    grantedBy: input.viewer.clerkId,
  };
  return { ok: true, grants: [...input.grants, next] };
}

export function revokeFixtureGrant(input: {
  viewer: FixtureViewer | null;
  grantId: string;
  grants: FixtureGrant[];
}):
  | { ok: true; grants: FixtureGrant[] }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  if (input.viewer === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  const grant = input.grants.find((row) => row.id === input.grantId);
  if (grant === undefined) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const resolved = resolveFixtureDocument({
    viewer: input.viewer,
    documentId: grant.documentId,
    grants: input.grants,
  });
  if (!resolved.ok || resolved.via !== "principal") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return {
    ok: true,
    grants: input.grants.map((row) =>
      row.id === input.grantId ? { ...row, revokedAt: Date.now() } : row,
    ),
  };
}
