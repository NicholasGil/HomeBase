"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import {
  emptyVendorPortalState,
  parseVendorPortalState,
  requestSeedAppointmentForViewer,
  requestSeedVendorDocument,
  sendSeedVendorMessage,
  uploadSeedVendorWorkProduct,
  markSeedAssignmentComplete,
  scheduleSeedVendor,
  VENDOR_EXPIRY_COOKIE,
  VENDOR_PORTAL_COOKIE,
} from "@/lib/vendor-access";

async function readPortalState() {
  const store = await cookies();
  return parseVendorPortalState(store.get(VENDOR_PORTAL_COOKIE)?.value);
}

async function writePortalState(state: ReturnType<typeof emptyVendorPortalState>) {
  const store = await cookies();
  store.set(VENDOR_PORTAL_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function loadFixtureVendorCookies() {
  const store = await cookies();
  return {
    expired: store.get(VENDOR_EXPIRY_COOKIE)?.value === "1",
    state: await readPortalState(),
  };
}

export async function requestFixtureAppointmentFromForm(formData: FormData) {
  const transactionId = formData.get("transactionId");
  const vendorId = formData.get("vendorId");
  if (typeof transactionId !== "string" || typeof vendorId !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const state = await readPortalState();
  const result = requestSeedAppointmentForViewer(
    session,
    { transactionId, vendorId },
    state,
  );
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writePortalState(result.state);
  redirect("/dashboard");
}

export async function sendFixtureVendorMessageFromForm(formData: FormData) {
  const assignmentId = formData.get("assignmentId");
  const body = formData.get("body");
  if (typeof assignmentId !== "string" || typeof body !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const result = sendSeedVendorMessage(
    session,
    { assignmentId, body, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writePortalState(result.state);
  redirect("/vendor");
}

export async function scheduleFixtureVendorFromForm(formData: FormData) {
  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const result = scheduleSeedVendor(
    session,
    { assignmentId, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writePortalState(result.state);
  redirect("/vendor");
}

export async function requestFixtureVendorDocumentFromForm(formData: FormData) {
  const assignmentId = formData.get("assignmentId");
  const documentType = formData.get("documentType");
  if (typeof assignmentId !== "string" || typeof documentType !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const result = requestSeedVendorDocument(
    session,
    { assignmentId, documentType, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writePortalState(result.state);
  redirect("/vendor");
}

export async function uploadFixtureVendorWorkFromForm(formData: FormData) {
  const assignmentId = formData.get("assignmentId");
  const kind = formData.get("kind");
  if (
    typeof assignmentId !== "string" ||
    (kind !== "report" && kind !== "invoice")
  ) {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const result = uploadSeedVendorWorkProduct(
    session,
    { assignmentId, kind, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writePortalState(result.state);
  redirect("/vendor");
}

export async function completeFixtureAssignmentFromForm(formData: FormData) {
  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const result = markSeedAssignmentComplete(
    session,
    { assignmentId, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writePortalState(result.state);
  redirect("/vendor");
}

export async function expireFixtureVendorAccessFromForm() {
  const store = await cookies();
  store.set(VENDOR_EXPIRY_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/vendor");
}
