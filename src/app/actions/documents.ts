"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import {
  DOCUMENT_AUDIT_COOKIE,
  DOCUMENT_GRANTS_COOKIE,
  grantFixtureDocument,
  parseFixtureAudit,
  parseFixtureGrants,
  resolveFixtureDocument,
  revokeFixtureGrant,
  type FixtureAuditEntry,
  type FixtureGrant,
} from "@/lib/document-access";
import { SEED_CLERK_IDS } from "../../../convex/seedPlan";

async function readGrants() {
  const store = await cookies();
  return parseFixtureGrants(store.get(DOCUMENT_GRANTS_COOKIE)?.value);
}

async function readAudit() {
  const store = await cookies();
  return parseFixtureAudit(store.get(DOCUMENT_AUDIT_COOKIE)?.value);
}

async function writeState(grants: FixtureGrant[], audit: FixtureAuditEntry[]) {
  const store = await cookies();
  store.set(DOCUMENT_GRANTS_COOKIE, JSON.stringify(grants), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  store.set(DOCUMENT_AUDIT_COOKIE, JSON.stringify(audit), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

function appendAudit(
  audit: FixtureAuditEntry[],
  entry: Omit<FixtureAuditEntry, "at">,
) {
  return [...audit, { ...entry, at: Date.now() }];
}

export async function loadFixtureVault() {
  const session = await getTestSession();
  const grants = await readGrants();
  const audit = await readAudit();
  return { session, grants, audit };
}

export async function openSeedDocument(input: { documentId: string }) {
  const session = await getTestSession();
  const grants = await readGrants();
  const resolved = resolveFixtureDocument({
    viewer: session,
    documentId: input.documentId,
    grants,
  });
  if (!resolved.ok) {
    return resolved;
  }
  const audit = appendAudit(await readAudit(), {
    actorClerkId: session?.clerkId ?? "unknown",
    action: "document.viewed",
    documentId: input.documentId,
  });
  await writeState(grants, audit);
  return { ...resolved, audit };
}

export async function grantSeedDocumentFromForm(formData: FormData) {
  const documentId = formData.get("documentId");
  if (typeof documentId !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const grants = await readGrants();
  const result = grantFixtureDocument({
    viewer: session,
    documentId,
    granteeClerkId: SEED_CLERK_IDS.lender,
    grants,
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
  const audit = appendAudit(await readAudit(), {
    actorClerkId: session?.clerkId ?? "unknown",
    action: "document.granted",
    documentId,
  });
  await writeState(result.grants, audit);
  redirect("/vault");
}

export async function revokeSeedGrantFromForm(formData: FormData) {
  const grantId = formData.get("grantId");
  if (typeof grantId !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const grants = await readGrants();
  const result = revokeFixtureGrant({
    viewer: session,
    grantId,
    grants,
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
  const grant = grants.find((row) => row.id === grantId);
  const audit = appendAudit(await readAudit(), {
    actorClerkId: session?.clerkId ?? "unknown",
    action: "document.revoked",
    documentId: grant?.documentId ?? "",
  });
  await writeState(result.grants, audit);
  redirect("/vault");
}
