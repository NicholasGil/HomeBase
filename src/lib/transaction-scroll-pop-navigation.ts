import { isTransactionScrollPath } from "@/lib/transaction-scroll-storage";

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
      markTransactionScrollPopNavigation(window.location.pathname);
    },
    true,
  );
}

export function markTransactionScrollPopNavigation(pathname: string): void {
  if (isTransactionScrollPath(pathname)) {
    pendingPopTransactionPath = pathname;
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
