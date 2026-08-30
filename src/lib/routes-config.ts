import {
  driveTimeSource,
  mustFailClosedRoutes,
  ProductionRoutesMisconfiguredError,
  resolveDriveMatrix,
  routesApiKeyPresent,
  type EnvMap,
} from "../../convex/lib/driveTimes";
import { isProductionDeploy, type AuthEnv } from "@/lib/auth-config";

export {
  driveTimeSource,
  mustFailClosedRoutes,
  ProductionRoutesMisconfiguredError,
  resolveDriveMatrix,
  routesApiKeyPresent,
};

export function assertCanUseFixtureDriveTimes(env: AuthEnv = process.env) {
  if (mustFailClosedRoutes(env as EnvMap)) {
    throw new ProductionRoutesMisconfiguredError();
  }
}

export function routesNoteForNeedsHuman() {
  return {
    issue: 1,
    blocked: "GOOGLE_MAPS_ROUTES_API_KEY",
    detail:
      "M4 uses the named fixture drive-time path locally and in CI. Production without a human-issued Routes API key fail-closes. Do not stub the key.",
    production: isProductionDeploy(),
  };
}
