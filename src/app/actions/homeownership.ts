"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import {
  loadSeedHubForViewer,
  reengageSeedVendorForViewer,
} from "@/lib/homeownership-access";

export const HUB_REENGAGE_COOKIE = "hb_hub_reengage";

async function readReengagedVendorIds() {
  const store = await cookies();
  const raw = store.get(HUB_REENGAGE_COOKIE)?.value;
  if (raw === undefined || raw.length === 0) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((row): row is string => typeof row === "string")
      : [];
  } catch {
    return [];
  }
}

async function writeReengagedVendorIds(vendorIds: string[]) {
  const store = await cookies();
  store.set(HUB_REENGAGE_COOKIE, JSON.stringify(vendorIds), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function loadFixtureHub(transactionId: string) {
  const session = await getTestSession();
  const reengaged = await readReengagedVendorIds();
  return loadSeedHubForViewer(session, transactionId, reengaged);
}

export async function reengageFixtureVendorFromForm(formData: FormData) {
  const transactionId = formData.get("transactionId");
  const vendorId = formData.get("vendorId");
  const compensationModel = formData.get("compensationModel");
  if (typeof transactionId !== "string" || typeof vendorId !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const reengaged = await readReengagedVendorIds();
  const result = reengageSeedVendorForViewer(
    session,
    {
      transactionId,
      vendorId,
      compensationModel:
        typeof compensationModel === "string" ? compensationModel : undefined,
    },
    reengaged,
  );
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writeReengagedVendorIds(
    result.view.vendors
      .filter((row) => row.reengaged)
      .map((row) => row.vendorId),
  );
  redirect(`/homeownership/${transactionId}`);
}
