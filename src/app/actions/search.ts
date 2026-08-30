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

function noticeForSignal(kind: "save" | "dislike" | "clear") {
  if (kind === "save") {
    return "saved";
  }
  if (kind === "dislike") {
    return "disliked";
  }
  return "restored";
}

function safeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return null;
  }
  if (value.startsWith("//") || value.includes("://")) {
    return null;
  }
  if (
    !value.startsWith("/search") &&
    !value.startsWith("/listings/") &&
    value !== "/listings"
  ) {
    return null;
  }
  return value;
}

export async function recordSearchSignalFromForm(formData: FormData) {
  const propertyId = formData.get("propertyId");
  const kind = formData.get("kind");
  const query = formData.get("query");
  if (
    typeof propertyId !== "string" ||
    (kind !== "save" && kind !== "dislike" && kind !== "clear")
  ) {
    redirect("/search?notice=denied");
  }
  const session = await getTestSession();
  const result = recordFixtureSignal({
    session,
    searchState: await readSearchState(),
    propertyId,
    kind,
  });
  if (!result.ok) {
    redirect("/search?notice=denied");
  }
  await writeSearchState(result.state);
  const nextQuery =
    typeof query === "string" && query.length > 0
      ? query
      : CANONICAL_SEARCH_QUERY;
  const params = new URLSearchParams({
    q: nextQuery,
    notice: noticeForSignal(kind),
    propertyId,
  });
  const returnTo = safeReturnTo(formData.get("returnTo"));
  if (returnTo !== null) {
    const separator = returnTo.includes("?") ? "&" : "?";
    redirect(`${returnTo}${separator}${params.toString()}`);
  }
  redirect(`/search?${params.toString()}`);
}
