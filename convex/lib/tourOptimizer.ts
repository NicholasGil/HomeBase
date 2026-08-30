import {
  directionsSummary,
  type DriveMatrix,
  type GeoPoint,
} from "./driveTimes";

export type AvailabilityWindow = {
  startsAt: number;
  endsAt: number;
};

export type TourPropertyInput = {
  id: string;
  label: string;
  brief: string;
  coordinates: GeoPoint;
  durationMinutes: number;
  windows: AvailabilityWindow[];
};

export type OptimizedStop = {
  propertyId: string;
  order: number;
  arriveAt: number;
  departAt: number;
  driveMinutes: number;
  directionsSummary: string;
  windowStartsAt: number;
  windowEndsAt: number;
  brief: string;
  label: string;
};

export type OptimizeInput = {
  origin: { label: string; coordinates: GeoPoint };
  properties: TourPropertyInput[];
  buyerWindows: AvailabilityWindow[];
  agentWindows: AvailabilityWindow[];
  bufferMinutes: number;
  matrix: DriveMatrix;
};

export type OptimizeResult =
  | {
      kind: "feasible";
      originDepartAt: number;
      stops: OptimizedStop[];
      totalDriveMinutes: number;
    }
  | {
      kind: "infeasible";
      reason: "empty" | "no_shared_window" | "no_feasible_order" | "too_many";
    };

const MAX_PERMUTATION_STOPS = 8;
const MINUTE_MS = 60_000;

export function intersectWindows(
  left: AvailabilityWindow[],
  right: AvailabilityWindow[],
): AvailabilityWindow[] {
  const out: AvailabilityWindow[] = [];
  for (const a of left) {
    for (const b of right) {
      const startsAt = Math.max(a.startsAt, b.startsAt);
      const endsAt = Math.min(a.endsAt, b.endsAt);
      if (endsAt > startsAt) {
        out.push({ startsAt, endsAt });
      }
    }
  }
  return out;
}

export function stopViolatesWindow(stop: OptimizedStop): boolean {
  return (
    stop.arriveAt < stop.windowStartsAt || stop.departAt > stop.windowEndsAt
  );
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) {
    return [items];
  }
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 1) {
    const head = items[i];
    if (head === undefined) {
      continue;
    }
    const rest = items.filter((_, index) => index !== i);
    for (const tail of permutations(rest)) {
      out.push([head, ...tail]);
    }
  }
  return out;
}

function matrixMinutes(
  matrix: DriveMatrix,
  fromIndex: number,
  toIndex: number,
): number {
  const row = matrix.minutes[fromIndex];
  const value = row?.[toIndex];
  if (value === undefined) {
    throw new Error("DRIVE_MATRIX_INCOMPLETE");
  }
  return value;
}

function placeInWindows(
  earliestArrive: number,
  durationMs: number,
  propertyWindows: AvailabilityWindow[],
  shared: AvailabilityWindow,
): { arriveAt: number; departAt: number; window: AvailabilityWindow } | null {
  let best: { arriveAt: number; departAt: number; window: AvailabilityWindow } | null =
    null;
  for (const window of propertyWindows) {
    const arriveAt = Math.max(earliestArrive, window.startsAt, shared.startsAt);
    const departAt = arriveAt + durationMs;
    const latestDepart = Math.min(window.endsAt, shared.endsAt);
    if (arriveAt >= window.startsAt && departAt <= latestDepart) {
      if (best === null || arriveAt < best.arriveAt) {
        best = { arriveAt, departAt, window };
      }
    }
  }
  return best;
}

function scheduleOrder(
  order: TourPropertyInput[],
  shared: AvailabilityWindow,
  input: OptimizeInput,
): {
  originDepartAt: number;
  stops: OptimizedStop[];
  totalDriveMinutes: number;
} | null {
  const stops: OptimizedStop[] = [];
  let fromIndex = 0;
  let fromPoint = input.origin.coordinates;
  let previousDepartAt = shared.startsAt;
  let originDepartAt = shared.startsAt;
  let totalDriveMinutes = 0;

  for (let i = 0; i < order.length; i += 1) {
    const property = order[i];
    if (property === undefined) {
      return null;
    }
    const toIndex =
      input.properties.findIndex((row) => row.id === property.id) + 1;
    if (toIndex === 0) {
      return null;
    }
    const driveMinutes = matrixMinutes(input.matrix, fromIndex, toIndex);
    const padMinutes = i === 0 ? 0 : input.bufferMinutes;
    const earliestArrive =
      previousDepartAt + (driveMinutes + padMinutes) * MINUTE_MS;
    const placed = placeInWindows(
      earliestArrive,
      property.durationMinutes * MINUTE_MS,
      property.windows,
      shared,
    );
    if (placed === null) {
      return null;
    }

    if (i === 0) {
      originDepartAt = placed.arriveAt - driveMinutes * MINUTE_MS;
      if (originDepartAt < shared.startsAt) {
        return null;
      }
    }

    const destLabel = `${property.label}`;
    const stop: OptimizedStop = {
      propertyId: property.id,
      order: i + 1,
      arriveAt: placed.arriveAt,
      departAt: placed.departAt,
      driveMinutes,
      directionsSummary: directionsSummary({
        from: fromPoint,
        to: property.coordinates,
        minutes: driveMinutes,
        destLabel,
      }),
      windowStartsAt: placed.window.startsAt,
      windowEndsAt: placed.window.endsAt,
      brief: property.brief,
      label: property.label,
    };
    if (stopViolatesWindow(stop)) {
      return null;
    }
    if (stop.arriveAt < shared.startsAt || stop.departAt > shared.endsAt) {
      return null;
    }

    stops.push(stop);
    previousDepartAt = placed.departAt;
    fromIndex = toIndex;
    fromPoint = property.coordinates;
    totalDriveMinutes += driveMinutes;
  }

  return { originDepartAt, stops, totalDriveMinutes };
}

function betterResult(
  current: Extract<OptimizeResult, { kind: "feasible" }> | null,
  next: Extract<OptimizeResult, { kind: "feasible" }>,
): Extract<OptimizeResult, { kind: "feasible" }> {
  if (current === null) {
    return next;
  }
  const currentEnd = current.stops[current.stops.length - 1]?.departAt ?? 0;
  const nextEnd = next.stops[next.stops.length - 1]?.departAt ?? 0;
  if (nextEnd !== currentEnd) {
    return nextEnd < currentEnd ? next : current;
  }
  if (next.totalDriveMinutes !== current.totalDriveMinutes) {
    return next.totalDriveMinutes < current.totalDriveMinutes ? next : current;
  }
  const currentKey = current.stops.map((stop) => stop.propertyId).join("|");
  const nextKey = next.stops.map((stop) => stop.propertyId).join("|");
  return nextKey < currentKey ? next : current;
}

export function optimizeTour(input: OptimizeInput): OptimizeResult {
  if (input.properties.length === 0) {
    return { kind: "infeasible", reason: "empty" };
  }
  if (input.properties.length > MAX_PERMUTATION_STOPS) {
    return { kind: "infeasible", reason: "too_many" };
  }

  const sharedWindows = intersectWindows(
    input.buyerWindows,
    input.agentWindows,
  );
  if (sharedWindows.length === 0) {
    return { kind: "infeasible", reason: "no_shared_window" };
  }

  let best: Extract<OptimizeResult, { kind: "feasible" }> | null = null;
  for (const order of permutations(input.properties)) {
    for (const shared of sharedWindows) {
      const scheduled = scheduleOrder(order, shared, input);
      if (scheduled === null) {
        continue;
      }
      best = betterResult(best, {
        kind: "feasible",
        originDepartAt: scheduled.originDepartAt,
        stops: scheduled.stops,
        totalDriveMinutes: scheduled.totalDriveMinutes,
      });
    }
  }

  if (best === null) {
    return { kind: "infeasible", reason: "no_feasible_order" };
  }
  return best;
}

export function formatTourInstant(
  at: number,
  timeZone = "America/Chicago",
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(at));
}
