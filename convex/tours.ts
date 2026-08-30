import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import {
  requireTourAccess,
  requireTransactionReadRole,
} from "./lib/authz";
import {
  fetchRoutesApiMatrix,
  resolveDriveMatrix,
  type GeoPoint,
} from "./lib/driveTimes";
import {
  optimizeTour,
  stopViolatesWindow,
  type OptimizedStop,
  type TourPropertyInput,
} from "./lib/tourOptimizer";
import {
  showingRatingsValidator,
  showingVerdictValidator,
} from "./lib/validators";
import { SEED_TOUR } from "./seedPlan";

type ReadCtx = QueryCtx | MutationCtx;

function propertyLabel(property: Doc<"properties">) {
  return `${property.address.line1}, ${property.address.city}`;
}

function isTourCandidate(property: Doc<"properties">, mlsEnabled: boolean) {
  if (property.source === "mls" && !mlsEnabled) {
    return false;
  }
  return (
    property.coordinates !== undefined &&
    property.brief !== undefined &&
    property.availabilityWindows !== undefined &&
    property.availabilityWindows.length > 0
  );
}

function toTourProperty(property: Doc<"properties">): TourPropertyInput {
  if (
    property.coordinates === undefined ||
    property.availabilityWindows === undefined
  ) {
    throw new Error("PROPERTY_NOT_TOURABLE");
  }
  return {
    id: property._id,
    label: propertyLabel(property),
    brief: property.brief ?? "",
    coordinates: property.coordinates,
    durationMinutes:
      property.showingDurationMinutes ?? SEED_TOUR.appointmentLengthMinutes,
    windows: property.availabilityWindows,
  };
}

async function orgAllowsMls(ctx: ReadCtx, orgId: Id<"orgs">) {
  const org = await ctx.db.get(orgId);
  return org?.flags.FLAG_MLS === true;
}

async function clientForBuilder(
  ctx: ReadCtx,
  session: { user: Doc<"users">; membership: Doc<"memberships"> },
  clientId?: Id<"clients">,
) {
  if (session.membership.role === "buyer") {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", session.user._id).eq("orgId", session.membership.orgId),
      )
      .unique();
    if (client === null) {
      throw new Error("FORBIDDEN");
    }
    return client;
  }
  if (clientId === undefined) {
    throw new Error("FORBIDDEN");
  }
  const client = await ctx.db.get(clientId);
  if (client === null || client.orgId !== session.membership.orgId) {
    throw new Error("FORBIDDEN");
  }
  if (session.membership.role === "agent") {
    const assigned = await ctx.db
      .query("transactions")
      .withIndex("by_agent", (q) => q.eq("agentId", session.user._id))
      .collect();
    if (!assigned.some((row) => row.clientId === client._id)) {
      throw new Error("FORBIDDEN");
    }
  }
  return client;
}

async function agentIdForClient(ctx: ReadCtx, clientId: Id<"clients">) {
  const transaction = await ctx.db
    .query("transactions")
    .withIndex("by_client", (q) => q.eq("clientId", clientId))
    .first();
  if (transaction === null) {
    throw new Error("FORBIDDEN");
  }
  return transaction.agentId;
}

function optimizeFromProperties(
  properties: Doc<"properties">[],
  buyerWindows: { startsAt: number; endsAt: number }[],
  agentWindows: { startsAt: number; endsAt: number }[],
  env: Record<string, string | undefined>,
  providedMatrix?: number[][],
) {
  const inputs = properties.map(toTourProperty);
  const points: GeoPoint[] = [
    SEED_TOUR.origin.coordinates,
    ...inputs.map((property) => property.coordinates),
  ];
  const matrix = resolveDriveMatrix(points, env, providedMatrix);
  const result = optimizeTour({
    origin: SEED_TOUR.origin,
    properties: inputs,
    buyerWindows,
    agentWindows,
    bufferMinutes: SEED_TOUR.bufferMinutes,
    matrix,
  });
  return { result, source: matrix.source };
}

function asPropertyId(
  value: string,
  allowed: Id<"properties">[],
): Id<"properties"> {
  const found = allowed.find((id) => id === value);
  if (found === undefined) {
    throw new Error("PROPERTY_NOT_TOURABLE");
  }
  return found;
}

async function replaceStops(
  ctx: MutationCtx,
  tourId: Id<"tours">,
  stops: OptimizedStop[],
  propertyIds: Id<"properties">[],
) {
  const existing = await ctx.db
    .query("tourStops")
    .withIndex("by_tour", (q) => q.eq("tourId", tourId))
    .collect();
  const keptFeedback: Array<{
    propertyId: Id<"properties">;
    row: Doc<"showingFeedback">;
  }> = [];
  for (const stop of existing) {
    const feedbackRows = await ctx.db
      .query("showingFeedback")
      .withIndex("by_tourStop", (q) => q.eq("tourStopId", stop._id))
      .collect();
    for (const row of feedbackRows) {
      keptFeedback.push({ propertyId: stop.propertyId, row });
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(stop._id);
  }

  for (const stop of stops) {
    const stopId = await ctx.db.insert("tourStops", {
      tourId,
      propertyId: asPropertyId(stop.propertyId, propertyIds),
      order: stop.order,
      arriveAt: stop.arriveAt,
      departAt: stop.departAt,
      driveMinutes: stop.driveMinutes,
      directionsSummary: stop.directionsSummary,
      windowStartsAt: stop.windowStartsAt,
      windowEndsAt: stop.windowEndsAt,
    });
    const prior = keptFeedback.find((row) => row.propertyId === stop.propertyId);
    if (prior !== undefined) {
      await ctx.db.insert("showingFeedback", {
        tourStopId: stopId,
        verdict: prior.row.verdict,
        ratings: prior.row.ratings,
        notes: prior.row.notes,
      });
    }
  }
}

export type TourItinerary = Awaited<ReturnType<typeof itineraryForTour>>;

async function itineraryForTour(ctx: ReadCtx, tour: Doc<"tours">) {
  const stops = (
    await ctx.db
      .query("tourStops")
      .withIndex("by_tour", (q) => q.eq("tourId", tour._id))
      .collect()
  ).sort((left, right) => left.order - right.order);

  const items = [];
  for (const stop of stops) {
    const property = await ctx.db.get(stop.propertyId);
    if (property === null) {
      throw new Error("FORBIDDEN");
    }
    const feedback = await ctx.db
      .query("showingFeedback")
      .withIndex("by_tourStop", (q) => q.eq("tourStopId", stop._id))
      .unique();
    const windowStartsAt = stop.windowStartsAt ?? 0;
    const windowEndsAt = stop.windowEndsAt ?? 0;
    items.push({
      stopId: stop._id,
      order: stop.order,
      arriveAt: stop.arriveAt,
      departAt: stop.departAt,
      driveMinutes: stop.driveMinutes,
      directionsSummary: stop.directionsSummary ?? "",
      windowStartsAt,
      windowEndsAt,
      windowViolated:
        windowStartsAt > 0 &&
        stopViolatesWindow({
          propertyId: stop.propertyId,
          order: stop.order,
          arriveAt: stop.arriveAt,
          departAt: stop.departAt,
          driveMinutes: stop.driveMinutes,
          directionsSummary: "",
          windowStartsAt,
          windowEndsAt,
          brief: "",
          label: "",
        }),
      property: {
        id: property._id,
        address: property.address,
        brief: property.brief ?? "",
        coordinates: property.coordinates ?? null,
        source: property.source,
      },
      feedback:
        feedback === null
          ? null
          : {
              verdict: feedback.verdict,
              ratings: feedback.ratings,
              notes: feedback.notes ?? null,
            },
    });
  }

  const first = items[0];
  const originDepartAt =
    first === undefined
      ? tour.date
      : first.arriveAt - first.driveMinutes * 60_000;
  return {
    tourId: tour._id,
    clientId: tour.clientId,
    agentId: tour.agentId,
    status: tour.status,
    date: tour.date,
    originLabel: tour.originLabel ?? SEED_TOUR.origin.label,
    originCoordinates: tour.originCoordinates ?? SEED_TOUR.origin.coordinates,
    bufferMinutes: tour.bufferMinutes ?? SEED_TOUR.bufferMinutes,
    driveTimeSource: tour.driveTimeSource ?? "fixture",
    originDepartAt,
    departureNotice: {
      message:
        first === undefined
          ? "No departure scheduled."
          : `You will be notified ${SEED_TOUR.departureNoticeMinutes} minutes before you leave for ${first.property.address.line1}.`,
      notifyAt: originDepartAt - SEED_TOUR.departureNoticeMinutes * 60_000,
      notifiedAt: tour.departureNotifiedAt ?? null,
    },
    stops: items,
  };
}

async function toursForSession(
  ctx: ReadCtx,
  session: { user: Doc<"users">; membership: Doc<"memberships"> },
) {
  if (session.membership.role === "buyer") {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", session.user._id).eq("orgId", session.membership.orgId),
      )
      .unique();
    if (client === null) {
      return [];
    }
    return await ctx.db
      .query("tours")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect();
  }
  if (session.membership.role === "agent") {
    return await ctx.db
      .query("tours")
      .withIndex("by_agent", (q) => q.eq("agentId", session.user._id))
      .collect();
  }
  const clients = await ctx.db
    .query("clients")
    .withIndex("by_org", (q) => q.eq("orgId", session.membership.orgId))
    .collect();
  const tours: Doc<"tours">[] = [];
  for (const client of clients) {
    const rows = await ctx.db
      .query("tours")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect();
    tours.push(...rows);
  }
  return tours;
}

export const listCandidates = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireTransactionReadRole(ctx);
    const mlsEnabled = await orgAllowsMls(ctx, membership.orgId);
    const properties = await ctx.db.query("properties").collect();
    return properties
      .filter((property) => isTourCandidate(property, mlsEnabled))
      .map((property) => ({
        _id: property._id,
        address: property.address,
        specs: property.specs,
        source: property.source,
        brief: property.brief ?? "",
        coordinates: property.coordinates ?? null,
        showingDurationMinutes:
          property.showingDurationMinutes ??
          SEED_TOUR.appointmentLengthMinutes,
        availabilityWindows: property.availabilityWindows ?? [],
      }));
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const session = await requireTransactionReadRole(ctx);
    const tours = await toursForSession(ctx, session);
    const active = tours.filter((tour) => tour.status !== "canceled");
    return await Promise.all(active.map((tour) => itineraryForTour(ctx, tour)));
  },
});

export const get = query({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    const { tour } = await requireTourAccess(ctx, args.tourId);
    return await itineraryForTour(ctx, tour);
  },
});

export const build = mutation({
  args: {
    propertyIds: v.array(v.id("properties")),
    date: v.optional(v.number()),
    clientId: v.optional(v.id("clients")),
    driveMatrix: v.optional(v.array(v.array(v.number()))),
  },
  handler: async (ctx, args) => {
    const session = await requireTransactionReadRole(ctx);
    const client = await clientForBuilder(ctx, session, args.clientId);
    const mlsEnabled = await orgAllowsMls(ctx, session.membership.orgId);
    const properties: Doc<"properties">[] = [];
    for (const propertyId of args.propertyIds) {
      const property = await ctx.db.get(propertyId);
      if (property === null || !isTourCandidate(property, mlsEnabled)) {
        throw new Error("PROPERTY_NOT_TOURABLE");
      }
      if (property.source === "mls" && !mlsEnabled) {
        throw new Error("MLS_DISABLED");
      }
      properties.push(property);
    }

    const agentId =
      session.membership.role === "agent"
        ? session.user._id
        : await agentIdForClient(ctx, client._id);
    const agent = await ctx.db.get(agentId);
    if (agent === null) {
      throw new Error("FORBIDDEN");
    }

    const { result, source } = optimizeFromProperties(
      properties,
      client.availabilityWindows ?? [...SEED_TOUR.buyerWindows],
      agent.availabilityWindows ?? [...SEED_TOUR.agentWindows],
      process.env,
      args.driveMatrix,
    );
    if (result.kind !== "feasible") {
      throw new Error("INFEASIBLE");
    }

    const existing = (
      await ctx.db
        .query("tours")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .collect()
    ).find((tour) => tour.status === "draft" || tour.status === "scheduled");

    const tourFields = {
      clientId: client._id,
      agentId: agent._id,
      date: args.date ?? SEED_TOUR.date,
      status: "scheduled" as const,
      originLabel: SEED_TOUR.origin.label,
      originCoordinates: SEED_TOUR.origin.coordinates,
      bufferMinutes: SEED_TOUR.bufferMinutes,
      appointmentLengthMinutes: SEED_TOUR.appointmentLengthMinutes,
      driveTimeSource: source,
    };

    const tourId =
      existing === undefined
        ? await ctx.db.insert("tours", tourFields)
        : existing._id;
    if (existing !== undefined) {
      await ctx.db.patch(tourId, tourFields);
    }
    await replaceStops(
      ctx,
      tourId,
      result.stops,
      properties.map((property) => property._id),
    );
    await appendAuditLog(ctx, {
      actorId: session.user._id,
      action: "tour.built",
      targetType: "tour",
      targetId: tourId,
      meta: { stops: String(result.stops.length), source },
    });
    const tour = await ctx.db.get(tourId);
    if (tour === null) {
      throw new Error("FORBIDDEN");
    }
    return await itineraryForTour(ctx, tour);
  },
});

export const removeStop = mutation({
  args: {
    tourId: v.id("tours"),
    stopId: v.id("tourStops"),
    driveMatrix: v.optional(v.array(v.array(v.number()))),
  },
  handler: async (ctx, args) => {
    const { user, tour, client } = await requireTourAccess(ctx, args.tourId);
    const stops = await ctx.db
      .query("tourStops")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();
    const removed = stops.find((stop) => stop._id === args.stopId);
    if (removed === undefined) {
      throw new Error("FORBIDDEN");
    }
    const remainingIds = stops
      .filter((stop) => stop._id !== args.stopId)
      .map((stop) => stop.propertyId);
    if (remainingIds.length === 0) {
      await replaceStops(ctx, args.tourId, [], []);
      await ctx.db.patch(args.tourId, { status: "canceled" });
      await appendAuditLog(ctx, {
        actorId: user._id,
        action: "tour.canceled",
        targetType: "tour",
        targetId: args.tourId,
        meta: { reason: "no_stops" },
      });
      const canceled = await ctx.db.get(args.tourId);
      if (canceled === null) {
        throw new Error("FORBIDDEN");
      }
      return await itineraryForTour(ctx, canceled);
    }

    const mlsEnabled = await orgAllowsMls(ctx, client.orgId);
    const properties: Doc<"properties">[] = [];
    for (const propertyId of remainingIds) {
      const property = await ctx.db.get(propertyId);
      if (property === null || !isTourCandidate(property, mlsEnabled)) {
        throw new Error("PROPERTY_NOT_TOURABLE");
      }
      properties.push(property);
    }
    const agent = await ctx.db.get(tour.agentId);
    if (agent === null) {
      throw new Error("FORBIDDEN");
    }
    const { result, source } = optimizeFromProperties(
      properties,
      client.availabilityWindows ?? [...SEED_TOUR.buyerWindows],
      agent.availabilityWindows ?? [...SEED_TOUR.agentWindows],
      process.env,
      args.driveMatrix,
    );
    if (result.kind !== "feasible") {
      throw new Error("INFEASIBLE");
    }
    await ctx.db.patch(args.tourId, {
      status: "scheduled",
      driveTimeSource: source,
    });
    await replaceStops(
      ctx,
      args.tourId,
      result.stops,
      properties.map((property) => property._id),
    );
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "tour.reoptimized",
      targetType: "tour",
      targetId: args.tourId,
      meta: { removedStop: args.stopId, stops: String(result.stops.length) },
    });
    const next = await ctx.db.get(args.tourId);
    if (next === null) {
      throw new Error("FORBIDDEN");
    }
    return await itineraryForTour(ctx, next);
  },
});

export const submitFeedback = mutation({
  args: {
    tourStopId: v.id("tourStops"),
    verdict: showingVerdictValidator,
    ratings: showingRatingsValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    for (const value of Object.values(args.ratings)) {
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error("INVALID_RATING");
      }
    }
    const stop = await ctx.db.get(args.tourStopId);
    if (stop === null) {
      throw new Error("FORBIDDEN");
    }
    const { user } = await requireTourAccess(ctx, stop.tourId);
    const existing = await ctx.db
      .query("showingFeedback")
      .withIndex("by_tourStop", (q) => q.eq("tourStopId", args.tourStopId))
      .unique();
    if (existing === null) {
      await ctx.db.insert("showingFeedback", {
        tourStopId: args.tourStopId,
        verdict: args.verdict,
        ratings: args.ratings,
        notes: args.notes,
      });
    } else {
      await ctx.db.patch(existing._id, {
        verdict: args.verdict,
        ratings: args.ratings,
        notes: args.notes,
      });
    }
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "showingFeedback.recorded",
      targetType: "tourStop",
      targetId: args.tourStopId,
      meta: { verdict: args.verdict },
    });
    const tour = await ctx.db.get(stop.tourId);
    if (tour === null) {
      throw new Error("FORBIDDEN");
    }
    return await itineraryForTour(ctx, tour);
  },
});

export const acknowledgeDepartureNotice = mutation({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    const { user, tour } = await requireTourAccess(ctx, args.tourId);
    const now = Date.now();
    await ctx.db.patch(args.tourId, { departureNotifiedAt: now });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "tour.departure_notice",
      targetType: "tour",
      targetId: args.tourId,
      meta: { at: String(now) },
    });
    const next = await ctx.db.get(tour._id);
    if (next === null) {
      throw new Error("FORBIDDEN");
    }
    return await itineraryForTour(ctx, next);
  },
});

export const fetchRouteMatrix = action({
  args: {
    points: v.array(v.object({ lat: v.number(), lng: v.number() })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("UNAUTHENTICATED");
    }
    return await fetchRoutesApiMatrix(args.points, process.env);
  },
});
