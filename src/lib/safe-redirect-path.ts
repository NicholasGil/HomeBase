/** Root-relative paths only — blocks protocol-relative and backslash open redirects. */
export const SAFE_RELATIVE_PATH = /^\/(?![/\\])/;

export const SAFE_REDIRECT_FALLBACK = "/demo";

/** ASCII controls, DEL, and whitespace — pathname only (see splitRedirectPath). */
export const UNSAFE_PATHNAME_CHARS = /[\x00-\x1F\x7F\s]/;

export function splitRedirectPath(path: string): {
  pathname: string;
  search: string;
  hash: string;
} {
  const hashIndex = path.indexOf("#");
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const queryIndex = withoutHash.indexOf("?");
  const pathname =
    queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
  return { pathname, search, hash };
}

export function pathnameContainsUnsafeCharacters(pathname: string): boolean {
  if (UNSAFE_PATHNAME_CHARS.test(pathname)) {
    return true;
  }
  if (!/%[0-9A-Fa-f]{2}/.test(pathname)) {
    return false;
  }
  try {
    return UNSAFE_PATHNAME_CHARS.test(decodeURIComponent(pathname));
  } catch {
    return true;
  }
}

export function isSafeRedirectPathname(pathname: string): boolean {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return false;
  }
  if (pathnameContainsUnsafeCharacters(pathname)) {
    return false;
  }
  return SAFE_RELATIVE_PATH.test(pathname);
}

export function sanitizeRedirectPath(
  path: string,
  fallback: string = SAFE_REDIRECT_FALLBACK,
): string {
  const { pathname, search, hash } = splitRedirectPath(path);
  if (!isSafeRedirectPathname(pathname)) {
    return fallback;
  }
  return `${pathname}${search}${hash}`;
}
