"use client";

import { useLayoutEffect, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { BUYER_COACH_HOME } from "@/lib/buyer-shell";
import { COACH_SCROLL_STORAGE_KEY } from "@/lib/coach-scroll-key";
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

function applyStoredCoachScroll(y: number) {
  const target = clampCoachScrollTarget(
    y,
    document.documentElement.scrollHeight,
    window.innerHeight,
  );
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, target);
  return target;
}

export function CoachScrollRestoration() {
  const pathname = usePathname();
  const onCoach = coachPath(pathname);
  const restoringRef = useRef(false);

  useLayoutEffect(() => {
    if (!onCoach) {
      return;
    }

    const previousRestoration = history.scrollRestoration;
    try {
      history.scrollRestoration = "auto";
    } catch {
      // ignore
    }

    const storedY = readCoachScrollY();
    if (storedY === null || storedY <= 0) {
      return () => {
        try {
          history.scrollRestoration = previousRestoration;
        } catch {
          // ignore
        }
      };
    }

    let userInteracted = false;
    let resizeListener: (() => void) | null = null;
    const timeoutIds: number[] = [];

    const stopProgrammaticRestore = () => {
      userInteracted = true;
      if (resizeListener !== null) {
        window.removeEventListener("resize", resizeListener);
        resizeListener = null;
      }
      for (const id of timeoutIds) {
        window.clearTimeout(id);
      }
      timeoutIds.length = 0;
    };

    const markUserIntent = () => {
      if (!restoringRef.current) {
        stopProgrammaticRestore();
      }
    };

    const restore = () => {
      if (userInteracted) {
        return;
      }
      restoringRef.current = true;
      applyStoredCoachScroll(storedY);
      restoringRef.current = false;
    };

    restore();

    resizeListener = () => {
      restore();
    };
    window.addEventListener("resize", resizeListener);

    timeoutIds.push(
      window.setTimeout(restore, 0),
      window.setTimeout(restore, 80),
    );

    window.addEventListener("wheel", markUserIntent, {
      passive: true,
      capture: true,
    });
    window.addEventListener("touchstart", markUserIntent, {
      passive: true,
      capture: true,
    });

    const onPopState = () => {
      if (isCoachScrollPath(window.location.pathname)) {
        userInteracted = false;
        restore();
      }
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      stopProgrammaticRestore();
      window.removeEventListener("wheel", markUserIntent, true);
      window.removeEventListener("touchstart", markUserIntent, true);
      window.removeEventListener("popstate", onPopState);
      try {
        history.scrollRestoration = previousRestoration;
      } catch {
        // ignore
      }
    };
  }, [pathname, onCoach]);

  useEffect(() => {
    if (!onCoach) {
      return;
    }
    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        writeCoachScrollY(window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [onCoach]);

  useEffect(() => {
    if (!onCoach) {
      return;
    }
    const saveScroll = () => {
      writeCoachScrollY(window.scrollY);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const link = target.closest('a[href^="/transactions/"]');
      if (link !== null) {
        saveScroll();
        return;
      }
      if (target.closest('[data-testid="coach-pricing-link"]') !== null) {
        saveScroll();
        return;
      }
      const tab = target.closest('[data-testid="app-tab-bar"] a[href]');
      if (tab !== null && tab instanceof HTMLAnchorElement) {
        const href = tab.getAttribute("href") ?? "";
        if (href !== pathname && href.startsWith("/")) {
          saveScroll();
        }
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, onCoach]);

  return null;
}
