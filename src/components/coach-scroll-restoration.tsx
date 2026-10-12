"use client";

import { useLayoutEffect, useEffect } from "react";
import { usePathname } from "next/navigation";

import { BUYER_COACH_HOME } from "@/lib/buyer-shell";

const COACH_SCROLL_KEY = "realtyrise.coach.scrollY.v1";
const MAX_RESTORE_ATTEMPTS = 12;

function coachPath(pathname: string) {
  return (
    pathname === BUYER_COACH_HOME ||
    pathname.startsWith(`${BUYER_COACH_HOME}/`)
  );
}

function readStoredScrollY(): number | null {
  const raw = sessionStorage.getItem(COACH_SCROLL_KEY);
  if (raw === null) {
    return null;
  }
  const y = Number.parseInt(raw, 10);
  return Number.isFinite(y) ? y : null;
}

function restoreCoachScroll(y: number) {
  const maxY = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const target = Math.min(y, maxY);
  window.scrollTo(0, target);
  return Math.abs(window.scrollY - target) < 2;
}

export function CoachScrollRestoration() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!coachPath(pathname)) {
      return;
    }
    const y = readStoredScrollY();
    if (y === null || y <= 0) {
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) {
        return;
      }
      const ok = restoreCoachScroll(y);
      attempts += 1;
      if (ok || attempts >= MAX_RESTORE_ATTEMPTS) {
        return;
      }
      requestAnimationFrame(tick);
    };

    restoreCoachScroll(y);
    requestAnimationFrame(() => {
      requestAnimationFrame(tick);
    });

    const onResize = () => {
      restoreCoachScroll(y);
    };
    window.addEventListener("resize", onResize);

    const delayed = window.setTimeout(() => restoreCoachScroll(y), 120);
    const delayed2 = window.setTimeout(() => restoreCoachScroll(y), 320);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.clearTimeout(delayed);
      window.clearTimeout(delayed2);
    };
  }, [pathname]);

  useEffect(() => {
    if (!coachPath(pathname)) {
      return;
    }
    const saveScroll = () => {
      sessionStorage.setItem(COACH_SCROLL_KEY, String(window.scrollY));
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
  }, [pathname]);

  return null;
}
