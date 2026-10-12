import { isCoachScrollPath } from "@/lib/coach-scroll-bootstrap-logic";

export function normalizeAppPath(href: string): string {
  const withoutHash = href.split("#")[0] ?? href;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  return withoutQuery.endsWith("/") && withoutQuery.length > 1
    ? withoutQuery.slice(0, -1)
    : withoutQuery;
}

export function hrefLeavesCoachRoute(
  href: string | null,
  currentPathname: string,
): boolean {
  if (href === null || !href.startsWith("/")) {
    return false;
  }
  if (!isCoachScrollPath(currentPathname)) {
    return false;
  }
  return normalizeAppPath(href) !== normalizeAppPath(currentPathname);
}

export function resolveLeaveCaptureYOffset(
  capturedY: number,
  existing: number | null,
): number {
  const rounded = Math.max(0, Math.round(capturedY));
  if (rounded > 0) {
    return rounded;
  }
  if (existing !== null && existing > 0) {
    return existing;
  }
  return 0;
}

export type LeaveCaptureLockState = {
  locked: boolean;
  releaseTimerId: ReturnType<typeof globalThis.setTimeout> | null;
};

export function releaseLeaveCaptureLock(state: LeaveCaptureLockState): void {
  state.locked = false;
  if (state.releaseTimerId !== null) {
    globalThis.clearTimeout(state.releaseTimerId);
    state.releaseTimerId = null;
  }
}

export function armLeaveCaptureLock(
  state: LeaveCaptureLockState,
  options?: { releaseAfterMs?: number; onReleased?: () => void },
): void {
  state.locked = true;
  if (state.releaseTimerId !== null) {
    globalThis.clearTimeout(state.releaseTimerId);
  }
  const ms = options?.releaseAfterMs ?? 2000;
  state.releaseTimerId = globalThis.setTimeout(() => {
    releaseLeaveCaptureLock(state);
    options?.onReleased?.();
  }, ms);
}
