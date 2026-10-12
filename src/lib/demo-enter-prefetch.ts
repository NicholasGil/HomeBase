const PREFETCH_PURPOSE_TOKENS = new Set(["prefetch", "prerender"]);

function purposeHeaderTokens(value: string | null): string[] {
  if (value === null) {
    return [];
  }
  return value
    .split(/[,;]/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);
}

function purposeHeadersIndicatePrefetch(request: Request): boolean {
  for (const name of ["purpose", "sec-purpose", "x-purpose"]) {
    const tokens = purposeHeaderTokens(request.headers.get(name));
    if (tokens.some((token) => PREFETCH_PURPOSE_TOKENS.has(token))) {
      return true;
    }
  }
  return false;
}

/** True when Next.js or the browser is prefetching (must not mint a session). */
export function isDemoEnterPrefetchRequest(request: Request): boolean {
  if (purposeHeadersIndicatePrefetch(request)) {
    return true;
  }
  const nextPrefetch = request.headers.get("next-router-prefetch");
  if (nextPrefetch === "1" || nextPrefetch?.toLowerCase() === "true") {
    return true;
  }
  const middlewarePrefetch = request.headers.get("x-middleware-prefetch");
  if (middlewarePrefetch === "1") {
    return true;
  }
  return false;
}
