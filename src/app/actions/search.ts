"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import {
  FIXTURE_SEARCH_COOKIE,
  loadFixtureSearch,
  parseFixtureSearch,
  recordFixtureSignal,
  type FixtureSearchState,
} from "@/lib/search-access";
import { FIXTURE_TOUR_COOKIE } from "@/lib/tour-access";
import { CANONICAL_SEARCH_QUERY } from "../../../convex/lib/propertySearch";

async function readSearchState() {
  const store = await cookies();
  return parseFixtureSearch(store.get(FIXTURE_SEARCH_COOKIE)?.value);
}

async function writeSearchState(state: FixtureSearchState) {
  const store = await cookies();
  store.set(FIXTURE_SEARCH_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function loadFixturePropertySearch(query?: string) {
  const session = await getTestSession();
  const store = await cookies();
  return loadFixtureSearch({
    session,
    query,
    searchState: await readSearchState(),
    tourCookie: store.get(FIXTURE_TOUR_COOKIE)?.value,
  });
}

export async function recordSearchSignalFromForm(formData: FormData) {
  const propertyId = formData.get("propertyId");
  const kind = formData.get("kind");
  const query = formData.get("query");
  if (
    typeof propertyId !== "string" ||
    (kind !== "save" && kind !== "dislike")
  ) {
    throw new Error("FORBIDDEN");
  }
  const session = await getTestSession();
  const result = recordFixtureSignal({
    session,
    searchState: await readSearchState(),
    propertyId,
    kind,
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
  await writeSearchState(result.state);
  const nextQuery =
    typeof query === "string" && query.length > 0
      ? query
      : CANONICAL_SEARCH_QUERY;
  redirect(`/search?q=${encodeURIComponent(nextQuery)}`);
}
