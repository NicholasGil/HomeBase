import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/app",
  "/dashboard",
  "/transactions",
  "/agent",
  "/broker",
  "/admin",
  "/vendor",
];

function clerkKeysPresent() {
  return (
    process.env.CLERK_SECRET_KEY !== undefined &&
    process.env.CLERK_SECRET_KEY.length > 0 &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== undefined &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0
  );
}

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (!clerkKeysPresent()) {
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );
  const isProtectedRoute = createRouteMatcher(
    PROTECTED_PREFIXES.map((prefix) => `${prefix}(.*)`),
  );

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
