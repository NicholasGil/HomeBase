const TRANSACTION_SCROLL_KEY_PREFIX = "realtyrise.transaction.scrollY.v1";

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
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

export function writeTransactionScrollY(y: number, pathname: string): void {
  if (!isTransactionScrollPath(pathname)) {
    return;
  }
  try {
    sessionStorage.setItem(
      transactionScrollStorageKey(pathname),
      String(Math.max(0, Math.round(y))),
    );
  } catch {
    // ignore
  }
}

export function clampTransactionScrollTarget(
  y: number,
  scrollHeight: number,
  innerHeight: number,
): number {
  const max = Math.max(0, scrollHeight - innerHeight);
  return Math.min(y, max);
}
