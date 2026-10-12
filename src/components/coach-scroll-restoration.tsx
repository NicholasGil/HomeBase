"use client";

import { useLayoutEffect, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { BUYER_COACH_HOME } from "@/lib/buyer-shell";
import {
  clampCoachScrollTarget,
  isCoachScrollPath,
} from "@/lib/coach-scroll-bootstrap-logic";
import {
  hrefLeavesCoachRoute,
  releaseLeaveCaptureLock,
  type LeaveCaptureLockState,
  armLeaveCaptureLock,
} from "@/lib/coach-scroll-leave-capture";
import {
  hrefStartsDemoEnter,
  markCoachScrollEnterStarted,
  syncCoachScrollEpochFromCookie,
} from "@/lib/coach-scroll-epoch";
import {
  applyDemoCoachScrollResetFromCookie,
  captureCoachScrollBeforeLeave,
  persistCoachScrollYOffset,
  readCoachScrollY,
  setCoachScrollLeaveCaptureLock,
} from "@/lib/coach-scroll-storage";
import {
  recordCoachScrollRestorationOriginal,
  resetCoachScrollRestorationToAuto,
} from "@/lib/coach-scroll-restoration-window";

function coachPath(pathname: string) {
  return (
    pathname === BUYER_COACH_HOME ||
    pathname.startsWith(`${BUYER_COACH_HOME}/`)
  );
}

function shouldSaveScrollForLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href") ?? "";
  if (!href.startsWith("/")) {
    return false;
  }
  if (href.startsWith("/transactions/")) {
    return true;
  }
  if (href.startsWith("/pricing")) {
    return true;
  }
  if (anchor.closest('[data-testid="app-tab-bar"]') !== null) {
    return true;
  }
  return false;
}

export function CoachScrollRestoration() {
  const pathname = usePathname();
  const onCoach = coachPath(pathname);
  const pathnameRef = useRef(pathname);
  const programmaticScrollRef = useRef(false);
  const suppressZeroScrollSaveUntilRef = useRef(0);
  const blockScrollSaveUntilRef = useRef(0);
  const leaveLockStateRef = useRef<LeaveCaptureLockState>({
    locked: false,
    releaseTimerId: null,
  });

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    syncCoachScrollEpochFromCookie();
    const onDemoEnterPointer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (
        anchor instanceof HTMLAnchorElement &&
        hrefStartsDemoEnter(anchor.getAttribute("href"))
      ) {
        markCoachScrollEnterStarted();
      }
    };
    document.addEventListener("pointerdown", onDemoEnterPointer, true);
    document.addEventListener("mousedown", onDemoEnterPointer, true);
    return () => {
      document.removeEventListener("pointerdown", onDemoEnterPointer, true);
      document.removeEventListener("mousedown", onDemoEnterPointer, true);
    };
  }, []);

  useEffect(() => {
    if (!onCoach) {
      return;
    }
    releaseLeaveCaptureLock(leaveLockStateRef.current);
    setCoachScrollLeaveCaptureLock(false);
  }, [pathname, onCoach]);

  useLayoutEffect(() => {
    if (!onCoach) {
      resetCoachScrollRestorationToAuto();
    }
  }, [pathname, onCoach]);

  const applyStoredCoachScroll = (y: number) => {
    const target = clampCoachScrollTarget(
      y,
      document.documentElement.scrollHeight,
      window.innerHeight,
    );
    programmaticScrollRef.current = true;
    window.scrollTo(0, target);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        programmaticScrollRef.current = false;
      });
    });
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 120);
    return target;
  };

  useLayoutEffect(() => {
    if (!onCoach) {
      return;
    }

    const resetScroll = applyDemoCoachScrollResetFromCookie();
    if (resetScroll) {
      window.scrollTo(0, 0);
    }

    recordCoachScrollRestorationOriginal();
    try {
      history.scrollRestoration = "manual";
    } catch {
      // ignore
    }

    const restoreFromStorage = () => {
      if (!isCoachScrollPath(window.location.pathname)) {
        return;
      }
      if (applyDemoCoachScrollResetFromCookie()) {
        return;
      }
      const storedY = readCoachScrollY(window.location.pathname);
      if (storedY === null || storedY <= 0) {
        if (window.scrollY > 10) {
          programmaticScrollRef.current = true;
          window.scrollTo(0, 0);
          window.setTimeout(() => {
            programmaticScrollRef.current = false;
          }, 120);
        }
        return;
      }
      applyStoredCoachScroll(storedY);
    };

    releaseLeaveCaptureLock(leaveLockStateRef.current);
    setCoachScrollLeaveCaptureLock(false);
    if (!resetScroll) {
      restoreFromStorage();
    }

    const onPopState = () => {
      if (!isCoachScrollPath(window.location.pathname)) {
        return;
      }
      pathnameRef.current = window.location.pathname;
      applyDemoCoachScrollResetFromCookie();
      restoreFromStorage();
    };
    window.addEventListener("popstate", onPopState);

    const onPageHide = () => {
      resetCoachScrollRestorationToAuto();
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagehide", onPageHide);
      resetCoachScrollRestorationToAuto();
    };
  }, [pathname, onCoach]);

  useLayoutEffect(() => {
    if (!onCoach) {
      return;
    }
    if (applyDemoCoachScrollResetFromCookie()) {
      window.scrollTo(0, 0);
      return;
    }

    const storedY = readCoachScrollY(pathname);
    if (storedY === null || storedY <= 0) {
      return;
    }

    let resizeListener: (() => void) | null = null;
    const timeoutIds: number[] = [];
    let cancelled = false;

    const cancelDeferredRestore = () => {
      if (cancelled) {
        return;
      }
      cancelled = true;
      if (resizeListener !== null) {
        window.removeEventListener("resize", resizeListener);
        resizeListener = null;
      }
      for (const id of timeoutIds) {
        window.clearTimeout(id);
      }
      timeoutIds.length = 0;
    };

    const restore = () => {
      if (cancelled) {
        return;
      }
      if (applyDemoCoachScrollResetFromCookie()) {
        cancelDeferredRestore();
        window.scrollTo(0, 0);
        return;
      }
      applyStoredCoachScroll(storedY);
    };

    restore();
    resizeListener = restore;
    window.addEventListener("resize", resizeListener);
    timeoutIds.push(
      window.setTimeout(restore, 0),
      window.setTimeout(restore, 80),
      window.setTimeout(restore, 150),
      window.setTimeout(restore, 300),
      window.setTimeout(restore, 500),
      window.setTimeout(restore, 800),
      window.setTimeout(restore, 1200),
    );

    const onUserScrollIntent = () => {
      if (programmaticScrollRef.current) {
        return;
      }
      cancelDeferredRestore();
    };
    const onScrollMaybeUser = () => {
      if (programmaticScrollRef.current) {
        return;
      }
      cancelDeferredRestore();
      window.removeEventListener("scroll", onScrollMaybeUser);
    };

    window.addEventListener("touchstart", onUserScrollIntent, {
      passive: true,
      once: true,
    });
    window.addEventListener("wheel", onUserScrollIntent, {
      passive: true,
      once: true,
    });
    window.addEventListener("keydown", onUserScrollIntent, { once: true });
    window.addEventListener("scroll", onScrollMaybeUser, { passive: true });

    return () => {
      cancelDeferredRestore();
      window.removeEventListener("touchstart", onUserScrollIntent);
      window.removeEventListener("wheel", onUserScrollIntent);
      window.removeEventListener("keydown", onUserScrollIntent);
      window.removeEventListener("scroll", onScrollMaybeUser);
    };
  }, [pathname, onCoach]);

  useEffect(() => {
    if (!onCoach) {
      return;
    }
    let frame = 0;
    const onScroll = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      if (programmaticScrollRef.current) {
        return;
      }
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!isCoachScrollPath(window.location.pathname)) {
          return;
        }
        if (Date.now() < blockScrollSaveUntilRef.current) {
          return;
        }
        const y = window.scrollY;
        if (
          y === 0 &&
          (Date.now() < suppressZeroScrollSaveUntilRef.current ||
            document.visibilityState !== "visible")
        ) {
          return;
        }
        persistCoachScrollYOffset(y);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, onCoach]);

  useEffect(() => {
    if (!onCoach) {
      return;
    }
    const onLeavingPointer = (event: Event) => {
      if (!isCoachScrollPath(window.location.pathname)) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (
        anchor instanceof HTMLAnchorElement &&
        shouldSaveScrollForLink(anchor)
      ) {
        const href = anchor.getAttribute("href");
        if (hrefStartsDemoEnter(href)) {
          markCoachScrollEnterStarted();
          return;
        }
        if (!hrefLeavesCoachRoute(href, window.location.pathname)) {
          return;
        }
        const capturedY = window.scrollY;
        const blockUntil = Date.now() + 1500;
        suppressZeroScrollSaveUntilRef.current = blockUntil;
        blockScrollSaveUntilRef.current = blockUntil;
        captureCoachScrollBeforeLeave(capturedY);
        armLeaveCaptureLock(leaveLockStateRef.current, {
          onReleased: () => {
            setCoachScrollLeaveCaptureLock(false);
          },
        });
        setCoachScrollLeaveCaptureLock(true);
      }
    };
    const onLeavingPointerCancel = () => {
      releaseLeaveCaptureLock(leaveLockStateRef.current);
      setCoachScrollLeaveCaptureLock(false);
    };
    document.addEventListener("pointerdown", onLeavingPointer, true);
    document.addEventListener("mousedown", onLeavingPointer, true);
    document.addEventListener("pointercancel", onLeavingPointerCancel, true);
    const leaveLock = leaveLockStateRef.current;
    return () => {
      document.removeEventListener("pointerdown", onLeavingPointer, true);
      document.removeEventListener("mousedown", onLeavingPointer, true);
      document.removeEventListener("pointercancel", onLeavingPointerCancel, true);
      releaseLeaveCaptureLock(leaveLock);
      setCoachScrollLeaveCaptureLock(false);
    };
  }, [pathname, onCoach]);

  return null;
}
