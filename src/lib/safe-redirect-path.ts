/** Root-relative paths only — blocks protocol-relative and backslash open redirects. */
export const SAFE_RELATIVE_PATH = /^\/(?![/\\])/;

export const SAFE_REDIRECT_FALLBACK = "/demo";

/** ASCII controls, DEL, and whitespace — pathname only (see splitRedirectPath). */
export const UNSAFE_PATHNAME_CHARS = /[\x00-\x1F\x7F\s]/;

/** Query/hash: controls and DEL only (decoded space in %20 is allowed). */
export const UNSAFE_QUERY_OR_HASH_CHARS = /[\x00-\x1F\x7F]/;

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

function partContainsUnsafeCharacters(
  part: string,
  unsafe: RegExp,
): boolean {
  if (part === "") {
    return false;
  }
  if (unsafe.test(part)) {
    return true;
  }
  if (!/%[0-9A-Fa-f]{2}/.test(part)) {
    return false;
  }
  try {
    let decoded = part;
    for (let depth = 0; depth < 2; depth += 1) {
      if (unsafe.test(decoded)) {
        return true;
      }
      if (!/%[0-9A-Fa-f]{2}/.test(decoded)) {
        break;
      }
      decoded = decodeURIComponent(decoded);
      if (decoded.startsWith("//") || decoded.includes("\\")) {
        return true;
      }
    }
    return unsafe.test(decoded);
  } catch {
    return true;
  }
}

export function pathnameContainsUnsafeCharacters(pathname: string): boolean {
  return partContainsUnsafeCharacters(pathname, UNSAFE_PATHNAME_CHARS);
}

export function searchOrHashContainsUnsafeCharacters(part: string): boolean {
  return partContainsUnsafeCharacters(part, UNSAFE_QUERY_OR_HASH_CHARS);
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
  if (
    searchOrHashContainsUnsafeCharacters(search) ||
    searchOrHashContainsUnsafeCharacters(hash)
  ) {
    return fallback;
  }
  return `${pathname}${search}${hash}`;
}
