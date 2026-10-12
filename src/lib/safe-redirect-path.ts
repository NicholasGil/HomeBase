/** Root-relative paths only — blocks protocol-relative and backslash open redirects. */
export const SAFE_RELATIVE_PATH = /^\/(?![/\\])/;

export const SAFE_REDIRECT_FALLBACK = "/demo";

/** Control characters, DEL, and any Unicode whitespace anywhere in the path. */
export const UNSAFE_REDIRECT_PATH_CHARS = /[\u0000-\u001F\u007F\s]/;

export function redirectPathContainsUnsafeCharacters(path: string): boolean {
  if (UNSAFE_REDIRECT_PATH_CHARS.test(path)) {
    return true;
  }
  if (!/%[0-9A-Fa-f]{2}/.test(path)) {
    return false;
  }
  try {
    return UNSAFE_REDIRECT_PATH_CHARS.test(decodeURIComponent(path));
  } catch {
    return true;
  }
}

export function isSafeRedirectPathname(pathname: string): boolean {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return false;
  }
  if (redirectPathContainsUnsafeCharacters(pathname)) {
    return false;
  }
  const pathOnly = pathname.split("#")[0]?.split("?")[0] ?? pathname;
  return SAFE_RELATIVE_PATH.test(pathOnly);
}

export function sanitizeRedirectPath(
  path: string,
  fallback: string = SAFE_REDIRECT_FALLBACK,
): string {
  if (redirectPathContainsUnsafeCharacters(path)) {
    return fallback;
  }
  const candidate = path.split("#")[0]?.split("?")[0] ?? path;
  if (!SAFE_RELATIVE_PATH.test(candidate)) {
    return fallback;
  }
  if (redirectPathContainsUnsafeCharacters(candidate)) {
    return fallback;
  }
  return path.startsWith("/") ? path : `/${path.replace(/^\//, "")}`;
}
