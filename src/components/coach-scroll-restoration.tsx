"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { BUYER_COACH_HOME } from "@/lib/buyer-shell";

const COACH_SCROLL_KEY = "realtyrise.coach.scrollY.v1";

function coachPath(pathname: string) {
  return (
    pathname === BUYER_COACH_HOME ||
    pathname.startsWith(`${BUYER_COACH_HOME}/`)
  );
}

export function CoachScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if (!coachPath(pathname)) {
      return;
    }
    const raw = sessionStorage.getItem(COACH_SCROLL_KEY);
    if (raw === null) {
      return;
    }
    const y = Number.parseInt(raw, 10);
    if (!Number.isFinite(y)) {
      return;
    }
    const apply = () => window.scrollTo(0, y);
    requestAnimationFrame(() => {
      apply();
      requestAnimationFrame(apply);
    });
  }, [pathname]);

  useEffect(() => {
    if (!coachPath(pathname)) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const link = target.closest('a[href^="/transactions/"]');
      if (link === null) {
        return;
      }
      sessionStorage.setItem(COACH_SCROLL_KEY, String(window.scrollY));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
