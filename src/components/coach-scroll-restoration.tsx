"use client";

import { useLayoutEffect, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { BUYER_COACH_HOME } from "@/lib/buyer-shell";
import {
  clampCoachScrollTarget,
  isCoachScrollPath,
} from "@/lib/coach-scroll-bootstrap-logic";
import {
  hrefStartsDemoEnter,
  markCoachScrollEnterStarted,
} from "@/lib/coach-scroll-epoch";
import {
  applyCoachPersonaEnterClear,
  coachNavLinkLeavesPath,
  persistCoachScrollOnLeave,
  readCoachScrollY,
  writeCoachScrollY,
} from "@/lib/coach-scroll-storage";
import { coachScrollRestoreOnPageShow } from "@/lib/coach-scroll-pageshow";
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
  const restoringRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const userScrolledRef = useRef(false);
  const blockZeroSaveUntilRef = useRef(0);
  const leavingCoachRef = useRef(false);
  const leaveCaptureReleaseTimerRef = useRef(0);

  useLayoutEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
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
    if (onCoach) {
      return;
    }
    resetCoachScrollRestorationToAuto();
  }, [onCoach]);

  const applyStoredCoachScroll = (path: string, y: number) => {
    const target = clampCoachScrollTarget(
      y,
      document.documentElement.scrollHeight,
      window.innerHeight,
    );
    restoringRef.current = true;
    blockZeroSaveUntilRef.current = Date.now() + 500;
    lastScrollYRef.current = target;
    window.scrollTo(0, target);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restoringRef.current = false;
      });
    });
    window.setTimeout(() => {
      restoringRef.current = false;
    }, 120);
    return target;
  };

  useLayoutEffect(() => {
    if (!onCoach) {
      return;
    }

    const personaEnter = applyCoachPersonaEnterClear(pathname);
    if (personaEnter.cleared) {
      lastScrollYRef.current = 0;
      window.scrollTo(0, 0);
    }

    recordCoachScrollRestorationOriginal();
    try {
      history.scrollRestoration = "manual";
    } catch {
      // ignore
    }

    const restoreFromStorage = () => {
      const personaEnter = applyCoachPersonaEnterClear(pathnameRef.current);
      if (personaEnter.cleared) {
        lastScrollYRef.current = 0;
        window.scrollTo(0, 0);
        return;
      }
      const storedY = readCoachScrollY(pathnameRef.current);
      if (storedY === null) {
        if (window.scrollY > 10) {
          window.scrollTo(0, 0);
        }
        return;
      }
      if (storedY <= 0) {
        if (window.scrollY > 10) {
          window.scrollTo(0, 0);
        }
        return;
      }
      applyStoredCoachScroll(pathnameRef.current, storedY);
    };

    if (!personaEnter.cleared) {
      restoreFromStorage();
    }

    const onCoachHistoryEntry = () => {
      if (!isCoachScrollPath(window.location.pathname)) {
        return;
      }
      pathnameRef.current = window.location.pathname;
      recordCoachScrollRestorationOriginal();
      try {
        history.scrollRestoration = "manual";
      } catch {
        // ignore
      }
      restoreFromStorage();
    };

    const onPopState = () => {
      onCoachHistoryEntry();
    };
    window.addEventListener("popstate", onPopState);

    const onPageShow = (event: PageTransitionEvent) => {
      if (!coachScrollRestoreOnPageShow(event, window.location.pathname)) {
        if (!isCoachScrollPath(window.location.pathname)) {
          resetCoachScrollRestorationToAuto();
        }
        return;
      }
      onCoachHistoryEntry();
    };
    window.addEventListener("pageshow", onPageShow);

    const onPageHide = () => {
      resetCoachScrollRestorationToAuto();
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
      resetCoachScrollRestorationToAuto();
    };
  }, [pathname, onCoach]);

  useLayoutEffect(() => {
    if (!onCoach) {
      return;
    }
    const personaEnter = applyCoachPersonaEnterClear(pathname);
    if (personaEnter.cleared) {
      lastScrollYRef.current = 0;
      window.scrollTo(0, 0);
      return;
    }
    const storedY = readCoachScrollY(pathname);
    if (storedY === null || storedY <= 0) {
      if (storedY === 0 && window.scrollY > 10) {
        window.scrollTo(0, 0);
      }
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
      if (cancelled || !isCoachScrollPath(pathnameRef.current)) {
        return;
      }
      const personaEnter = applyCoachPersonaEnterClear(pathnameRef.current);
      if (personaEnter.cleared) {
        cancelDeferredRestore();
        lastScrollYRef.current = 0;
        window.scrollTo(0, 0);
        return;
      }
      const liveY = readCoachScrollY(pathnameRef.current);
      if (liveY === null || liveY <= 0) {
        return;
      }
      applyStoredCoachScroll(pathnameRef.current, liveY);
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
      cancelDeferredRestore();
    };
    const onScrollMaybeUser = () => {
      if (restoringRef.current) {
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
    const markUserScroll = () => {
      userScrolledRef.current = true;
    };
    window.addEventListener("wheel", markUserScroll, { passive: true });
    window.addEventListener("touchmove", markUserScroll, { passive: true });
    window.addEventListener("keydown", markUserScroll);
    let frame = 0;
    const onScroll = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      if (!isCoachScrollPath(window.location.pathname)) {
        return;
      }
      const y = window.scrollY;
      if (y > 0) {
        leavingCoachRef.current = false;
        lastScrollYRef.current = y;
        writeCoachScrollY(y, pathname);
      }
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!isCoachScrollPath(window.location.pathname)) {
          return;
        }
        if (window.scrollY > 0) {
          return;
        }
        if (leavingCoachRef.current || Date.now() < blockZeroSaveUntilRef.current) {
          return;
        }
        if (userScrolledRef.current && lastScrollYRef.current > 0) {
          userScrolledRef.current = false;
        }
        lastScrollYRef.current = 0;
        writeCoachScrollY(0, pathname, { forceZero: true });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", markUserScroll);
      window.removeEventListener("touchmove", markUserScroll);
      window.removeEventListener("keydown", markUserScroll);
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, onCoach]);

  useEffect(() => {
    if (!onCoach) {
      return;
    }
    const saveScroll = () => {
      persistCoachScrollOnLeave(
        window.scrollY,
        lastScrollYRef.current,
        pathname,
      );
    };
    const onLeavingPointer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (hrefStartsDemoEnter(anchor.getAttribute("href"))) {
        markCoachScrollEnterStarted();
        return;
      }
      if (
        shouldSaveScrollForLink(anchor) &&
        coachNavLinkLeavesPath(anchor.getAttribute("href"), pathname)
      ) {
        saveScroll();
        leavingCoachRef.current = true;
        window.clearTimeout(leaveCaptureReleaseTimerRef.current);
        leaveCaptureReleaseTimerRef.current = window.setTimeout(() => {
          if (isCoachScrollPath(window.location.pathname)) {
            leavingCoachRef.current = false;
          }
        }, 600);
      }
    };
    const onPointerCancel = () => {
      leavingCoachRef.current = false;
      window.clearTimeout(leaveCaptureReleaseTimerRef.current);
    };
    const onPageHide = () => {
      leavingCoachRef.current = false;
      window.clearTimeout(leaveCaptureReleaseTimerRef.current);
    };
    document.addEventListener("pointerdown", onLeavingPointer, true);
    document.addEventListener("mousedown", onLeavingPointer, true);
    document.addEventListener("click", onLeavingPointer, true);
    document.addEventListener("pointercancel", onPointerCancel, true);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("pointerdown", onLeavingPointer, true);
      document.removeEventListener("mousedown", onLeavingPointer, true);
      document.removeEventListener("click", onLeavingPointer, true);
      document.removeEventListener("pointercancel", onPointerCancel, true);
      window.removeEventListener("pagehide", onPageHide);
      window.clearTimeout(leaveCaptureReleaseTimerRef.current);
    };
  }, [pathname, onCoach]);

  return null;
}
