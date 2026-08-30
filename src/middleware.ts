import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { unauthenticatedAuthAction } from "@/lib/auth-config";
import { serviceUnavailableResponse } from "@/lib/service-unavailable";

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const action = unauthenticatedAuthAction();

  if (action === "unavailable") {
    return serviceUnavailableResponse();
  }

  if (action === "skip") {
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
    "/vault(.*)",
    "/documents(.*)",
    "/tours(.*)",
    "/offers(.*)",
    "/sign(.*)",
    "/identity(.*)",
    "/search(.*)",
    "/homeownership(.*)",
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
