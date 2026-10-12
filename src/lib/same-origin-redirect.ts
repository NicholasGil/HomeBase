import { NextResponse } from "next/server";

import {
  SAFE_REDIRECT_FALLBACK,
  isSafeRedirectPathname,
  sanitizeRedirectPath,
} from "@/lib/safe-redirect-path";

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
  if (safeDestination === SAFE_REDIRECT_FALLBACK) {
    return redirectToPath(SAFE_REDIRECT_FALLBACK, request, init);
  }

  let target: URL;
  try {
    target = new URL(safeDestination, requestUrl);
  } catch {
    return redirectToPath(SAFE_REDIRECT_FALLBACK, request, init);
  }

  if (target.origin !== requestUrl.origin) {
    return redirectToPath(SAFE_REDIRECT_FALLBACK, request, init);
  }

  if (!isSafeRedirectPathname(target.pathname)) {
    return redirectToPath(SAFE_REDIRECT_FALLBACK, request, init);
  }

  const relative = `${target.pathname}${target.search}${target.hash}`;
  const normalized = sanitizeRedirectPath(relative);
  return redirectToPath(normalized, request, init);
}
