"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import { pathWithNotice } from "@/lib/form-notices";
import {
  emptyVendorPortalState,
  parseVendorPortalState,
  recoverLiveSeedAssignment,
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

function vendorDenied(): never {
  redirect(pathWithNotice("/vendor", "vendor-denied"));
}

export async function requestFixtureAppointmentFromForm(formData: FormData) {
  const transactionId = formData.get("transactionId");
  const vendorId = formData.get("vendorId");
  if (typeof transactionId !== "string" || typeof vendorId !== "string") {
    redirect(pathWithNotice("/dashboard", "denied"));
  }
  const session = await getTestSession();
  const state = await readPortalState();
  const result = requestSeedAppointmentForViewer(
    session,
    { transactionId, vendorId },
    state,
  );
  if (!result.ok) {
    redirect(pathWithNotice("/dashboard", "denied"));
  }
  await writePortalState(result.state);
  redirect("/dashboard");
}

export async function sendFixtureVendorMessageFromForm(formData: FormData) {
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const submittedId = formData.get("assignmentId");
  const recovered = recoverLiveSeedAssignment(session, {
    expired: cookiesState.expired,
    state: cookiesState.state,
  });
  const assignmentId =
    typeof submittedId === "string" && submittedId.length > 0
      ? submittedId
      : recovered.ok
        ? recovered.assignment.assignmentId
        : "";
  const rawBody = formData.get("body");
  const body = typeof rawBody === "string" ? rawBody : "";
  if (assignmentId.length === 0) {
    vendorDenied();
  }
  const result = sendSeedVendorMessage(
    session,
    { assignmentId, body, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    if (result.reason === "EMPTY") {
      redirect(pathWithNotice("/vendor", "empty-message"));
    }
    vendorDenied();
  }
  await writePortalState(result.state);
  redirect(pathWithNotice("/vendor", "sent"));
}

export async function scheduleFixtureVendorFromForm(formData: FormData) {
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const submittedId = formData.get("assignmentId");
  const recovered = recoverLiveSeedAssignment(session, {
    expired: cookiesState.expired,
    state: cookiesState.state,
  });
  const assignmentId =
    typeof submittedId === "string" && submittedId.length > 0
      ? submittedId
      : recovered.ok
        ? recovered.assignment.assignmentId
        : "";
  if (assignmentId.length === 0) {
    vendorDenied();
  }
  const result = scheduleSeedVendor(
    session,
    { assignmentId, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    vendorDenied();
  }
  await writePortalState(result.state);
  redirect("/vendor");
}

export async function requestFixtureVendorDocumentFromForm(formData: FormData) {
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const submittedId = formData.get("assignmentId");
  const recovered = recoverLiveSeedAssignment(session, {
    expired: cookiesState.expired,
    state: cookiesState.state,
  });
  const assignmentId =
    typeof submittedId === "string" && submittedId.length > 0
      ? submittedId
      : recovered.ok
        ? recovered.assignment.assignmentId
        : "";
  const documentType = formData.get("documentType");
  if (assignmentId.length === 0 || typeof documentType !== "string") {
    vendorDenied();
  }
  const result = requestSeedVendorDocument(
    session,
    { assignmentId, documentType, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    vendorDenied();
  }
  await writePortalState(result.state);
  redirect("/vendor");
}

export async function uploadFixtureVendorWorkFromForm(formData: FormData) {
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const submittedId = formData.get("assignmentId");
  const recovered = recoverLiveSeedAssignment(session, {
    expired: cookiesState.expired,
    state: cookiesState.state,
  });
  const assignmentId =
    typeof submittedId === "string" && submittedId.length > 0
      ? submittedId
      : recovered.ok
        ? recovered.assignment.assignmentId
        : "";
  const kind = formData.get("kind");
  if (
    assignmentId.length === 0 ||
    (kind !== "report" && kind !== "invoice")
  ) {
    vendorDenied();
  }
  const result = uploadSeedVendorWorkProduct(
    session,
    { assignmentId, kind, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    vendorDenied();
  }
  await writePortalState(result.state);
  redirect("/vendor");
}

export async function completeFixtureAssignmentFromForm(formData: FormData) {
  const session = await getTestSession();
  const cookiesState = await loadFixtureVendorCookies();
  const submittedId = formData.get("assignmentId");
  const recovered = recoverLiveSeedAssignment(session, {
    expired: cookiesState.expired,
    state: cookiesState.state,
  });
  const assignmentId =
    typeof submittedId === "string" && submittedId.length > 0
      ? submittedId
      : recovered.ok
        ? recovered.assignment.assignmentId
        : "";
  if (assignmentId.length === 0) {
    vendorDenied();
  }
  const result = markSeedAssignmentComplete(
    session,
    { assignmentId, expired: cookiesState.expired },
    cookiesState.state,
  );
  if (!result.ok) {
    vendorDenied();
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
