/** Root-relative paths only — blocks protocol-relative and backslash open redirects. */
export const SAFE_RELATIVE_PATH = /^\/(?![/\\])/;

export const SAFE_REDIRECT_FALLBACK = "/demo";

export function sanitizeRedirectPath(
  path: string,
  fallback: string = SAFE_REDIRECT_FALLBACK,
): string {
  const candidate = path.split("#")[0]?.split("?")[0] ?? path;
  if (!SAFE_RELATIVE_PATH.test(candidate)) {
    return fallback;
  }
  return path.startsWith("/") ? path : `/${path.replace(/^\//, "")}`;
}
