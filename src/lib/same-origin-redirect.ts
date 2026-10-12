import { NextResponse } from "next/server";

import { sanitizeRedirectPath } from "@/lib/safe-redirect-path";

/** Redirect with a root-relative Location so host/proto follow the incoming request. */
export function redirectToPath(
  path: string,
  request: Request,
  init?: ResponseInit,
): NextResponse {
  const normalized = sanitizeRedirectPath(path);
  const response = new NextResponse(null, {
    ...init,
    status: init?.status ?? 307,
    headers: {
      ...Object.fromEntries(new Headers(init?.headers).entries()),
      Location: normalized,
    },
  });
  return response;
}

export function redirectToPathFromRequestUrl(
  destinationPath: string,
  request: Request,
  init?: ResponseInit,
): NextResponse {
  const requestUrl = new URL(request.url);
  const safeDestination = sanitizeRedirectPath(destinationPath);
  const target = new URL(safeDestination, requestUrl);
  if (target.origin !== requestUrl.origin) {
    return redirectToPath(safeDestination, request, init);
  }
  return redirectToPath(
    `${target.pathname}${target.search}${target.hash}`,
    request,
    init,
  );
}
