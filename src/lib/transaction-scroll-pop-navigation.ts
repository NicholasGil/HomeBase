import {
  clampTransactionScrollTarget,
  isTransactionScrollPath,
  persistTransactionScrollOnLeave,
  readTransactionScrollY,
  transactionScrollLastKnown,
} from "@/lib/transaction-scroll-storage";

export const TRANSACTION_POP_RESTORE_PATH_KEY =
  "realtyrise.transaction.popRestorePath";

let pendingPopTransactionPath: string | null = null;
let popstateListenerRegistered = false;

/** Synchronous popstate hook — must run before React remounts transaction routes. */
export function ensureTransactionScrollPopstateListener(): void {
  if (popstateListenerRegistered || typeof window === "undefined") {
    return;
  }
  popstateListenerRegistered = true;
  window.addEventListener(
    "popstate",
    () => {
      const path = window.location.pathname;
      markTransactionScrollPopNavigation(path);
      syncRestoreTransactionScrollOnPop(path);
    },
    true,
  );
  const persistTxnScrollOnLeave = () => {
    const path = window.location.pathname;
    if (!isTransactionScrollPath(path)) {
      return;
    }
    persistTransactionScrollOnLeave(
      window.scrollY,
      transactionScrollLastKnown(path),
      path,
    );
  };
  window.addEventListener("pagehide", persistTxnScrollOnLeave, true);
  window.addEventListener("beforeunload", persistTxnScrollOnLeave, true);
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "hidden") {
        persistTxnScrollOnLeave();
      }
    },
    true,
  );
  window.addEventListener(
    "pageshow",
    (event) => {
      const path = window.location.pathname;
      if (!isTransactionScrollPath(path)) {
        return;
      }
      if (event.persisted || pendingPopTransactionPath === path) {
        syncRestoreTransactionScrollOnPop(path);
      }
    },
    true,
  );
}

export function peekTransactionScrollPopNavigation(): string | null {
  return pendingPopTransactionPath;
}

/** Synchronous pop restore before React layout (history back/forward). */
export function syncRestoreTransactionScrollOnPop(pathname: string): void {
  if (!isTransactionScrollPath(pathname)) {
    return;
  }
  const y = readTransactionScrollY(pathname);
  if (y === null || y <= 0) {
    return;
  }
  const minHeight = y + window.innerHeight;
  if (document.documentElement.scrollHeight < minHeight) {
    document.documentElement.style.minHeight = `${minHeight}px`;
  }
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const target = clampTransactionScrollTarget(
      y,
      document.documentElement.scrollHeight,
      window.innerHeight,
    );
    window.scrollTo(0, target);
    if (Math.abs(window.scrollY - target) <= 10) {
      return;
    }
  }
}

export function markTransactionScrollPopNavigation(pathname: string): void {
  if (isTransactionScrollPath(pathname)) {
    pendingPopTransactionPath = pathname;
    try {
      sessionStorage.setItem(TRANSACTION_POP_RESTORE_PATH_KEY, pathname);
    } catch {
      // ignore
    }
  }
}

export function consumeTransactionScrollPopNavigation(pathname: string): boolean {
  if (
    pendingPopTransactionPath !== null &&
    pendingPopTransactionPath === pathname
  ) {
    pendingPopTransactionPath = null;
    return true;
  }
  return false;
}

/** Drop a stale POP flag after in-component restore (forward drill must not consume). */
export function clearTransactionScrollPopNavigation(): void {
  pendingPopTransactionPath = null;
}

/** Test-only reset */
export function resetTransactionScrollPopNavigationForTests(): void {
  pendingPopTransactionPath = null;
}
