const TRANSACTION_SCROLL_KEY_PREFIX = "realtyrise.transaction.scrollY.v1";

const lastKnownScrollYByPath = new Map<string, number>();

export function transactionScrollLastKnown(pathname: string): number {
  return lastKnownScrollYByPath.get(pathname) ?? 0;
}

export function isTransactionScrollPath(pathname: string): boolean {
  return pathname.startsWith("/transactions/");
}

export function transactionScrollStorageKey(pathname: string): string {
  return `${TRANSACTION_SCROLL_KEY_PREFIX}:${pathname}`;
}

export function readTransactionScrollY(pathname: string): number | null {
  if (!isTransactionScrollPath(pathname)) {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(transactionScrollStorageKey(pathname));
    if (raw === null) {
      return null;
    }
    const y = Number.parseInt(raw, 10);
    if (Number.isFinite(y)) {
      return y;
    }
    return null;
  } catch {
    // ignore
  }
  const known = lastKnownScrollYByPath.get(pathname);
  return known !== undefined && known > 0 ? known : null;
}

export type WriteTransactionScrollOptions = { forceZero?: boolean };

export function writeTransactionScrollY(
  y: number,
  pathname: string,
  options?: WriteTransactionScrollOptions,
): void {
  if (!isTransactionScrollPath(pathname)) {
    return;
  }
  if (!Number.isFinite(y)) {
    return;
  }
  const rounded = Math.max(0, Math.round(y));
  if (rounded <= 0 && !options?.forceZero) {
    const existing = readTransactionScrollY(pathname);
    if (existing !== null && existing > 0) {
      return;
    }
  }
  if (rounded > 0) {
    lastKnownScrollYByPath.set(pathname, rounded);
  }
  try {
    sessionStorage.setItem(
      transactionScrollStorageKey(pathname),
      String(rounded),
    );
  } catch {
    // ignore
  }
}

/** Pointerdown / pagehide leave — never clobber positive depth with zero. */
export function transactionScrollYForLeavePersist(
  scrollY: number,
  lastScrollYForPath: number,
): number | null {
  const y = scrollY > 0 ? scrollY : lastScrollYForPath;
  return y > 0 ? Math.round(y) : null;
}

/** @deprecated use transactionScrollYForLeavePersist */
export function transactionScrollYForPageHidePersist(
  scrollY: number,
  lastScrollY: number,
): number | null {
  return transactionScrollYForLeavePersist(scrollY, lastScrollY);
}

export function persistTransactionScrollOnLeave(
  scrollY: number,
  lastScrollYForPath: number,
  pathname: string,
): void {
  const y = transactionScrollYForLeavePersist(scrollY, lastScrollYForPath);
  if (y === null) {
    return;
  }
  writeTransactionScrollY(y, pathname);
}

export function clampTransactionScrollTarget(
  y: number,
  scrollHeight: number,
  innerHeight: number,
): number {
  const max = Math.max(0, scrollHeight - innerHeight);
  return Math.min(Math.max(0, y), max);
}
