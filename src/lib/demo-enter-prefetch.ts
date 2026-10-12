/** True when Next.js or the browser is prefetching (must not mint a session). */
export function isDemoEnterPrefetchRequest(request: Request): boolean {
  const purpose = request.headers.get("purpose")?.toLowerCase();
  if (purpose === "prefetch") {
    return true;
  }
  const secPurpose = request.headers.get("sec-purpose")?.toLowerCase();
  if (secPurpose === "prefetch") {
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
