"use client";

import { useLayoutEffect, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { BUYER_COACH_HOME } from "@/lib/buyer-shell";
import {
  clampCoachScrollTarget,
  isCoachScrollPath,
} from "@/lib/coach-scroll-bootstrap-logic";
import { readCoachScrollY, writeCoachScrollY } from "@/lib/coach-scroll-storage";

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

function applyStoredCoachScroll(pathname: string, y: number) {
  const target = clampCoachScrollTarget(
    y,
    document.documentElement.scrollHeight,
    window.innerHeight,
  );
  window.scrollTo(0, target);
  return target;
}

export function CoachScrollRestoration() {
  const pathname = usePathname();
  const onCoach = coachPath(pathname);
  const restoringRef = useRef(false);
  const pathnameRef = useRef(pathname);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useLayoutEffect(() => {
    if (!onCoach) {
      return;
    }

    const previousRestoration = history.scrollRestoration;
    try {
      history.scrollRestoration = "manual";
    } catch {
      // ignore
    }

    const restoreFromStorage = () => {
      const storedY = readCoachScrollY(pathnameRef.current);
      if (storedY === null || storedY <= 0) {
        return;
      }
      restoringRef.current = true;
      applyStoredCoachScroll(pathnameRef.current, storedY);
      restoringRef.current = false;
    };

    restoreFromStorage();

    const onPopState = () => {
      if (!isCoachScrollPath(window.location.pathname)) {
        return;
      }
      pathnameRef.current = window.location.pathname;
      restoreFromStorage();
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      try {
        history.scrollRestoration = previousRestoration;
      } catch {
        // ignore
      }
    };
  }, [pathname, onCoach]);

  useLayoutEffect(() => {
    if (!onCoach) {
      return;
    }
    const storedY = readCoachScrollY(pathname);
    if (storedY === null || storedY <= 0) {
      return;
    }

    let resizeListener: (() => void) | null = null;
    const timeoutIds: number[] = [];

    const restore = () => {
      applyStoredCoachScroll(pathname, storedY);
    };

    restore();
    resizeListener = restore;
    window.addEventListener("resize", resizeListener);
    timeoutIds.push(window.setTimeout(restore, 0), window.setTimeout(restore, 80));

    return () => {
      if (resizeListener !== null) {
        window.removeEventListener("resize", resizeListener);
      }
      for (const id of timeoutIds) {
        window.clearTimeout(id);
      }
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
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (window.scrollY > 0) {
          lastScrollYRef.current = window.scrollY;
          writeCoachScrollY(window.scrollY, pathname);
        }
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
    const saveScroll = () => {
      const y = Math.max(window.scrollY, lastScrollYRef.current);
      writeCoachScrollY(y, pathname);
    };
    const onLeavingPointer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (anchor instanceof HTMLAnchorElement && shouldSaveScrollForLink(anchor)) {
        saveScroll();
      }
    };
    const onPageHide = () => {
      saveScroll();
    };
    document.addEventListener("pointerdown", onLeavingPointer, true);
    document.addEventListener("mousedown", onLeavingPointer, true);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("pointerdown", onLeavingPointer, true);
      document.removeEventListener("mousedown", onLeavingPointer, true);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [pathname, onCoach]);

  return null;
}
