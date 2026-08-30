"use server";

import { getTestSession } from "@/app/actions/test-session";
import {
  loadFixtureEsign,
  parseFixtureEsign,
  sendFixturePacket,
  signFixturePacket,
  FIXTURE_ESIGN_COOKIE,
} from "@/lib/esign-access";
import { cookies } from "next/headers";

async function readState() {
  const store = await cookies();
  return parseFixtureEsign(store.get(FIXTURE_ESIGN_COOKIE)?.value);
}

export async function loadFixtureSignatureWorkflow() {
  const session = await getTestSession();
  return loadFixtureEsign({ session, state: await readState() });
}

export async function sendFixturePacketFromForm() {
  const session = await getTestSession();
  return sendFixturePacket({ session });
}

export async function signFixturePacketFromForm() {
  const session = await getTestSession();
  return signFixturePacket({ session });
}
