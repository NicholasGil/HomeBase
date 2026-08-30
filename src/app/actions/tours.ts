"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import {
  buildFixtureTour,
  FIXTURE_TOUR_COOKIE,
  listFixtureCandidates,
  listFixtureTours,
  parseFixtureTours,
  removeFixtureStop,
  sessionAsViewer,
  submitFixtureFeedback,
  type FixtureTourState,
} from "@/lib/tour-access";

async function readState(): Promise<FixtureTourState> {
  const store = await cookies();
  return parseFixtureTours(store.get(FIXTURE_TOUR_COOKIE)?.value);
}

async function writeState(state: FixtureTourState) {
  const store = await cookies();
  store.set(FIXTURE_TOUR_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function loadFixtureTours() {
  const session = await getTestSession();
  const state = await readState();
  const viewer = sessionAsViewer(session);
  const candidates = listFixtureCandidates(viewer);
  const tours = listFixtureTours({ viewer, state });
  return { session, candidates, tours };
}

export async function buildTourFromForm(formData: FormData) {
  const session = await getTestSession();
  const propertyIds = formData
    .getAll("propertyIds")
    .filter((value): value is string => typeof value === "string");
  const result = buildFixtureTour({
    viewer: sessionAsViewer(session),
    propertyIds,
    state: await readState(),
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writeState(result.state);
  redirect("/tours");
}

export async function removeStopFromForm(formData: FormData) {
  const tourId = formData.get("tourId");
  const stopId = formData.get("stopId");
  if (typeof tourId !== "string" || typeof stopId !== "string") {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const result = removeFixtureStop({
    viewer: sessionAsViewer(session),
    state: await readState(),
    tourId,
    stopId,
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writeState(result.state);
  redirect("/tours");
}

export async function submitFeedbackFromForm(formData: FormData) {
  const tourId = formData.get("tourId");
  const stopId = formData.get("stopId");
  const verdict = formData.get("verdict");
  if (
    typeof tourId !== "string" ||
    typeof stopId !== "string" ||
    (verdict !== "love" && verdict !== "maybe" && verdict !== "no")
  ) {
    throw new Error("FORBIDDEN");
  }
  const rating = (name: string) => {
    const raw = formData.get(name);
    const value = typeof raw === "string" ? Number.parseInt(raw, 10) : Number.NaN;
    return value;
  };
  const session = await getTestSession();
  const result = submitFixtureFeedback({
    viewer: sessionAsViewer(session),
    state: await readState(),
    tourId,
    stopId,
    verdict,
    ratings: {
      kitchen: rating("kitchen"),
      location: rating("location"),
      yard: rating("yard"),
      condition: rating("condition"),
      layout: rating("layout"),
      value: rating("value"),
    },
    notes:
      typeof formData.get("notes") === "string"
        ? String(formData.get("notes"))
        : undefined,
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writeState(result.state);
  redirect("/tours?notice=feedback");
}
