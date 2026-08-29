import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import {
  clerkKeysPresent,
  isProductionDeploy,
  isProtectedPath,
} from "@/lib/auth-config";
import { serviceUnavailableResponse } from "@/lib/service-unavailable";

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (!clerkKeysPresent()) {
    if (isProductionDeploy() && isProtectedPath(request.nextUrl.pathname)) {
      return serviceUnavailableResponse();
    }
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );
  const isProtectedRoute = createRouteMatcher([
    "/app(.*)",
    "/dashboard(.*)",
    "/transactions(.*)",
    "/agent(.*)",
    "/broker(.*)",
    "/admin(.*)",
    "/vendor(.*)",
  ]);

  return clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  })(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
