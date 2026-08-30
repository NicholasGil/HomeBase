import { fixtureDriveMatrix } from "../../convex/lib/driveTimes";
import {
  optimizeTour,
  stopViolatesWindow,
  type OptimizedStop,
} from "../../convex/lib/tourOptimizer";
import { assertCanUseFixtureDriveTimes } from "@/lib/routes-config";
import {
  isSeedTourPropertyId,
  seedTourListings,
  SEED_TOUR,
  type SeedTourPropertyId,
} from "@/lib/seed-tours";
import type { TestSession } from "@/lib/test-session";

export const FIXTURE_TOUR_COOKIE = "hb_fixture_tour";

export type FixtureViewer = {
  clerkId: string;
  role: "buyer" | "vendor" | "agent" | "broker" | "admin";
};

export type FixtureStop = OptimizedStop & {
  stopId: string;
};

export type FixtureFeedback = {
  stopId: string;
  propertyId: string;
  verdict: "love" | "maybe" | "no";
  ratings: {
    kitchen: number;
    location: number;
    yard: number;
    condition: number;
    layout: number;
    value: number;
  };
  notes?: string;
};

export type FixtureTour = {
  tourId: string;
  ownerClerkId: string;
  status: "scheduled" | "canceled";
  date: number;
  originLabel: string;
  originCoordinates: { lat: number; lng: number };
  originDepartAt: number;
  driveTimeSource: "fixture";
  departureNotice: {
    message: string;
    notifyAt: number;
    notifiedAt: number | null;
  };
  stops: FixtureStop[];
  feedback: FixtureFeedback[];
};

export type FixtureTourState = {
  tours: FixtureTour[];
};

export function parseFixtureTours(value: string | undefined): FixtureTourState {
  if (value === undefined || value.length === 0) {
    return { tours: [] };
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || !("tours" in parsed)) {
      return { tours: [] };
    }
    const tours = (parsed as { tours: unknown }).tours;
    if (!Array.isArray(tours)) {
      return { tours: [] };
    }
    return { tours: tours as FixtureTour[] };
  } catch {
    return { tours: [] };
  }
}

function canBuildTours(viewer: FixtureViewer | null) {
  if (viewer === null) {
    return { ok: false as const, reason: "UNAUTHENTICATED" as const };
  }
  if (viewer.role === "vendor") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return { ok: true as const, viewer };
}

export function listFixtureCandidates(viewer: FixtureViewer | null) {
  const access = canBuildTours(viewer);
  if (!access.ok) {
    return access;
  }
  return { ok: true as const, listings: seedTourListings() };
}

export function listFixtureTours(input: {
  viewer: FixtureViewer | null;
  state: FixtureTourState;
}) {
  const access = canBuildTours(input.viewer);
  if (!access.ok) {
    return access;
  }
  return {
    ok: true as const,
    tours: input.state.tours.filter(
      (tour) =>
        tour.ownerClerkId === access.viewer.clerkId && tour.status !== "canceled",
    ),
  };
}

export function getFixtureTour(input: {
  viewer: FixtureViewer | null;
  state: FixtureTourState;
  tourId: string;
}) {
  const listed = listFixtureTours(input);
  if (!listed.ok) {
    return listed;
  }
  const tour = listed.tours.find((row) => row.tourId === input.tourId);
  if (tour === undefined) {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return { ok: true as const, tour };
}

function toStops(resultStops: OptimizedStop[], ownerClerkId: string): FixtureStop[] {
  return resultStops.map((stop) => ({
    ...stop,
    stopId: `stop:${ownerClerkId}:${stop.propertyId}:${stop.order}`,
  }));
}

function itineraryFromStops(
  ownerClerkId: string,
  stops: FixtureStop[],
  feedback: FixtureFeedback[],
  notifiedAt: number | null,
): FixtureTour {
  const first = stops[0];
  const originDepartAt =
    first === undefined
      ? SEED_TOUR.date
      : first.arriveAt - first.driveMinutes * 60_000;
  return {
    tourId: `seed-tour:${ownerClerkId}`,
    ownerClerkId,
    status: stops.length === 0 ? "canceled" : "scheduled",
    date: SEED_TOUR.date,
    originLabel: SEED_TOUR.origin.label,
    originCoordinates: SEED_TOUR.origin.coordinates,
    originDepartAt,
    driveTimeSource: "fixture",
    departureNotice: {
      message:
        first === undefined
          ? "No departure scheduled."
          : `You will be notified ${SEED_TOUR.departureNoticeMinutes} minutes before you leave for ${first.label}.`,
      notifyAt: originDepartAt - SEED_TOUR.departureNoticeMinutes * 60_000,
      notifiedAt,
    },
    stops,
    feedback,
  };
}

function optimizeIds(propertyIds: SeedTourPropertyId[]) {
  const listings = seedTourListings().filter((listing) =>
    propertyIds.includes(listing.id),
  );
  const points = [
    SEED_TOUR.origin.coordinates,
    ...listings.map((listing) => listing.coordinates),
  ];
  return optimizeTour({
    origin: SEED_TOUR.origin,
    properties: listings.map((listing) => ({
      id: listing.id,
      label: `${listing.address.line1}, ${listing.address.city}`,
      brief: listing.brief,
      coordinates: listing.coordinates,
      durationMinutes: listing.showingDurationMinutes,
      windows: listing.availabilityWindows,
    })),
    buyerWindows: [...SEED_TOUR.buyerWindows],
    agentWindows: [...SEED_TOUR.agentWindows],
    bufferMinutes: SEED_TOUR.bufferMinutes,
    matrix: fixtureDriveMatrix(points),
  });
}

export function buildFixtureTour(input: {
  viewer: FixtureViewer | null;
  propertyIds: string[];
  state: FixtureTourState;
}):
  | { ok: true; state: FixtureTourState; tour: FixtureTour }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" | "INFEASIBLE" } {
  assertCanUseFixtureDriveTimes();
  const access = canBuildTours(input.viewer);
  if (!access.ok) {
    return access;
  }
  const propertyIds = input.propertyIds.filter(isSeedTourPropertyId);
  if (propertyIds.length === 0) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const result = optimizeIds(propertyIds);
  if (result.kind !== "feasible") {
    return { ok: false, reason: "INFEASIBLE" };
  }
  const tour = itineraryFromStops(
    access.viewer.clerkId,
    toStops(result.stops, access.viewer.clerkId),
    [],
    null,
  );
  return {
    ok: true,
    tour,
    state: {
      tours: [
        ...input.state.tours.filter(
          (row) => row.ownerClerkId !== access.viewer.clerkId,
        ),
        tour,
      ],
    },
  };
}

export function removeFixtureStop(input: {
  viewer: FixtureViewer | null;
  state: FixtureTourState;
  tourId: string;
  stopId: string;
}):
  | { ok: true; state: FixtureTourState; tour: FixtureTour }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" | "INFEASIBLE" } {
  assertCanUseFixtureDriveTimes();
  const loaded = getFixtureTour(input);
  if (!loaded.ok) {
    return loaded;
  }
  const removed = loaded.tour.stops.find((stop) => stop.stopId === input.stopId);
  if (removed === undefined) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const remaining = loaded.tour.stops
    .filter((stop) => stop.stopId !== input.stopId)
    .map((stop) => stop.propertyId)
    .filter(isSeedTourPropertyId);
  if (remaining.length === 0) {
    const canceled = itineraryFromStops(
      loaded.tour.ownerClerkId,
      [],
      [],
      loaded.tour.departureNotice.notifiedAt,
    );
    return {
      ok: true,
      tour: canceled,
      state: {
        tours: input.state.tours.map((row) =>
          row.tourId === input.tourId ? canceled : row,
        ),
      },
    };
  }
  const result = optimizeIds(remaining);
  if (result.kind !== "feasible") {
    return { ok: false, reason: "INFEASIBLE" };
  }
  const keptFeedback = loaded.tour.feedback.filter(
    (row) => row.propertyId !== removed.propertyId,
  );
  const tour = itineraryFromStops(
    loaded.tour.ownerClerkId,
    toStops(result.stops, loaded.tour.ownerClerkId),
    keptFeedback,
    loaded.tour.departureNotice.notifiedAt,
  );
  return {
    ok: true,
    tour,
    state: {
      tours: input.state.tours.map((row) =>
        row.tourId === input.tourId ? tour : row,
      ),
    },
  };
}

export function submitFixtureFeedback(input: {
  viewer: FixtureViewer | null;
  state: FixtureTourState;
  tourId: string;
  stopId: string;
  verdict: "love" | "maybe" | "no";
  ratings: FixtureFeedback["ratings"];
  notes?: string;
}):
  | { ok: true; state: FixtureTourState; tour: FixtureTour }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  const loaded = getFixtureTour(input);
  if (!loaded.ok) {
    return loaded;
  }
  const stop = loaded.tour.stops.find((row) => row.stopId === input.stopId);
  if (stop === undefined) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  for (const value of Object.values(input.ratings)) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return { ok: false, reason: "FORBIDDEN" };
    }
  }
  const nextFeedback: FixtureFeedback = {
    stopId: stop.stopId,
    propertyId: stop.propertyId,
    verdict: input.verdict,
    ratings: input.ratings,
    notes: input.notes,
  };
  const tour: FixtureTour = {
    ...loaded.tour,
    feedback: [
      ...loaded.tour.feedback.filter((row) => row.stopId !== stop.stopId),
      nextFeedback,
    ],
  };
  return {
    ok: true,
    tour,
    state: {
      tours: input.state.tours.map((row) =>
        row.tourId === input.tourId ? tour : row,
      ),
    },
  };
}

export function fixtureStopViolatesWindow(stop: FixtureStop) {
  return stopViolatesWindow(stop);
}

export function sessionAsViewer(
  session: TestSession | null,
): FixtureViewer | null {
  if (session === null) {
    return null;
  }
  return { clerkId: session.clerkId, role: session.role };
}
