"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import {
  FIXTURE_OFFER_COOKIE,
  ensureFixtureDraft,
  loadFixtureOfferCenter,
  parseFixtureOffers,
  sessionAsOfferViewer,
  submitFixtureOffer,
  type FixtureOfferState,
} from "@/lib/offer-access";

async function readState(): Promise<FixtureOfferState> {
  const store = await cookies();
  return parseFixtureOffers(store.get(FIXTURE_OFFER_COOKIE)?.value);
}

async function writeState(state: FixtureOfferState) {
  const store = await cookies();
  store.set(FIXTURE_OFFER_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function loadFixtureOffers() {
  const session = await getTestSession();
  const viewer = sessionAsOfferViewer(session);
  const state = await readState();
  return loadFixtureOfferCenter({ viewer, state });
}

export async function submitOfferFromForm() {
  const session = await getTestSession();
  const viewer = sessionAsOfferViewer(session);
  const state = await readState();
  const drafted = ensureFixtureDraft({ viewer, state });
  if (drafted.ok) {
    await writeState(drafted.state);
  }
  const result = submitFixtureOffer({
    viewer,
    state: drafted.ok ? drafted.state : state,
  });
  if (!result.ok && result.reason === "LICENSEE_REVIEW_REQUIRED") {
    redirect("/offers?gate=LICENSEE_REVIEW_REQUIRED");
  }
  if (!result.ok) {
    throw new Error(result.reason);
  }
  redirect("/offers");
}
