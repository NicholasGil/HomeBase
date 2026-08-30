export type GeoPoint = {
  lat: number;
  lng: number;
};

export type DriveTimeSource = "fixture" | "routes_api";

export type EnvMap = Record<string, string | undefined>;

export const ROUTES_API_KEY_ENV = "GOOGLE_MAPS_ROUTES_API_KEY";

export type DriveMatrix = {
  source: DriveTimeSource;
  minutes: number[][];
};

const EARTH_MILES = 3958.8;
const FIXTURE_SPEED_MPH = 35;
const FIXTURE_OVERHEAD_MINUTES = 2;

export function isProductionDeploy(env: EnvMap = process.env) {
  return env.VERCEL_ENV === "production";
}

export function routesApiKeyPresent(env: EnvMap = process.env) {
  const key = env[ROUTES_API_KEY_ENV];
  return Boolean(key && key.length > 0);
}

export function driveTimeSource(
  env: EnvMap = process.env,
): DriveTimeSource | "unavailable" {
  if (routesApiKeyPresent(env)) {
    return "routes_api";
  }
  if (isProductionDeploy(env)) {
    return "unavailable";
  }
  return "fixture";
}

export function mustFailClosedRoutes(env: EnvMap = process.env) {
  return isProductionDeploy(env) && !routesApiKeyPresent(env);
}

export class ProductionRoutesMisconfiguredError extends Error {
  readonly status = 503;

  constructor() {
    super("Routes API is not configured");
    this.name = "ProductionRoutesMisconfiguredError";
  }
}

function toRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

export function haversineMiles(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function fixtureDriveMinutes(from: GeoPoint, to: GeoPoint): number {
  if (from.lat === to.lat && from.lng === to.lng) {
    return 0;
  }
  const driving =
    (haversineMiles(from, to) / FIXTURE_SPEED_MPH) * 60 +
    FIXTURE_OVERHEAD_MINUTES;
  return Math.max(1, Math.round(driving));
}

export function fixtureDriveMatrix(points: GeoPoint[]): DriveMatrix {
  return {
    source: "fixture",
    minutes: points.map((from) =>
      points.map((to) => fixtureDriveMinutes(from, to)),
    ),
  };
}

export function resolveDriveMatrix(
  points: GeoPoint[],
  env: EnvMap = process.env,
  provided?: number[][],
): DriveMatrix {
  const source = driveTimeSource(env);
  if (source === "unavailable") {
    throw new ProductionRoutesMisconfiguredError();
  }
  if (source === "routes_api") {
    if (provided === undefined) {
      throw new Error("ROUTES_API_MATRIX_REQUIRED");
    }
    return { source: "routes_api", minutes: provided };
  }
  return fixtureDriveMatrix(points);
}

export function initialBearing(from: GeoPoint, to: GeoPoint): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const CARDINALS = [
  "north",
  "northeast",
  "east",
  "southeast",
  "south",
  "southwest",
  "west",
  "northwest",
] as const;

export function cardinalFromBearing(bearing: number): string {
  const index = Math.round(bearing / 45) % CARDINALS.length;
  return CARDINALS[index] ?? "north";
}

export function directionsSummary(input: {
  from: GeoPoint;
  to: GeoPoint;
  minutes: number;
  destLabel: string;
}): string {
  const heading = cardinalFromBearing(initialBearing(input.from, input.to));
  return `Drive ${input.minutes} minutes ${heading} to ${input.destLabel}.`;
}

/**
 * Live Routes API client. Requires GOOGLE_MAPS_ROUTES_API_KEY.
 * Never invent a key. Production without one is fail-closed via driveTimeSource.
 * Blocked on needs-human #1.
 */
export async function fetchRoutesApiMatrix(
  points: GeoPoint[],
  env: EnvMap = process.env,
): Promise<DriveMatrix> {
  const key = env[ROUTES_API_KEY_ENV];
  if (key === undefined || key.length === 0) {
    throw new Error("ROUTES_API_KEY_MISSING");
  }

  const waypoints = points.map((point) => ({
    waypoint: {
      location: {
        latLng: { latitude: point.lat, longitude: point.lng },
      },
    },
  }));

  const response = await fetch(
    "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "originIndex,destinationIndex,duration,distanceMeters,status",
      },
      body: JSON.stringify({
        origins: waypoints,
        destinations: waypoints,
        travelMode: "DRIVE",
      }),
    },
  );

  if (!response.ok) {
    throw new Error("ROUTES_API_REQUEST_FAILED");
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("ROUTES_API_RESPONSE_INVALID");
  }

  const minutes = points.map(() => points.map(() => 0));
  for (const row of payload) {
    if (typeof row !== "object" || row === null) {
      throw new Error("ROUTES_API_RESPONSE_INVALID");
    }
    const entry = row as {
      originIndex?: unknown;
      destinationIndex?: unknown;
      duration?: unknown;
    };
    if (
      typeof entry.originIndex !== "number" ||
      typeof entry.destinationIndex !== "number"
    ) {
      throw new Error("ROUTES_API_RESPONSE_INVALID");
    }
    const duration =
      typeof entry.duration === "string"
        ? Number.parseInt(entry.duration, 10)
        : typeof entry.duration === "object" &&
            entry.duration !== null &&
            "seconds" in entry.duration
          ? Number((entry.duration as { seconds: unknown }).seconds)
          : Number.NaN;
    if (!Number.isFinite(duration)) {
      throw new Error("ROUTES_API_RESPONSE_INVALID");
    }
    const from = minutes[entry.originIndex];
    if (from === undefined) {
      throw new Error("ROUTES_API_RESPONSE_INVALID");
    }
    from[entry.destinationIndex] = Math.max(0, Math.round(duration / 60));
  }

  return { source: "routes_api", minutes };
}
