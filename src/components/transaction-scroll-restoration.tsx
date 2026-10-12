"use client";

import { useLayoutEffect, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  clampTransactionScrollTarget,
  isTransactionScrollPath,
  readTransactionScrollY,
  writeTransactionScrollY,
} from "@/lib/transaction-scroll-storage";
import { recordCoachScrollRestorationOriginal } from "@/lib/coach-scroll-restoration-window";

function shouldSaveScrollForLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href") ?? "";
  if (!href.startsWith("/")) {
    return false;
  }
  if (anchor.closest('[data-testid="app-tab-bar"]') !== null) {
    return true;
  }
  return href.startsWith("/coach") || href.startsWith("/search");
}

export function TransactionScrollRestoration() {
  const pathname = usePathname();
  const onTransaction = isTransactionScrollPath(pathname);
  const pathnameRef = useRef(pathname);
  const restoringRef = useRef(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const applyScrollY = (path: string, y: number) => {
    const target = clampTransactionScrollTarget(
      y,
      document.documentElement.scrollHeight,
      window.innerHeight,
    );
    restoringRef.current = true;
    window.scrollTo(0, target);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restoringRef.current = false;
      });
    });
    return target;
  };

  useLayoutEffect(() => {
    if (!onTransaction) {
      return;
    }

    const restoreUntilStable = (path: string, storedY: number | null) => {
      let cancelled = false;
      let lastHeight = 0;
      let stableHeightPasses = 0;
      let attempts = 0;
      const maxAttempts = 40;

      const tick = () => {
        const activePath = window.location.pathname;
        if (cancelled || !isTransactionScrollPath(activePath)) {
          return;
        }
        const height = document.documentElement.scrollHeight;
        if (height === lastHeight) {
          stableHeightPasses += 1;
        } else {
          stableHeightPasses = 0;
          lastHeight = height;
        }

        const liveY = readTransactionScrollY(activePath);
        const effectiveY =
          storedY !== null && storedY > 0 ? storedY : liveY;

        if (effectiveY === null || effectiveY <= 0) {
          // Fresh navigation: do not write or force scroll on mount.
        } else {
          const minHeight = effectiveY + window.innerHeight;
          if (height < minHeight) {
            if (attempts < maxAttempts) {
              window.requestAnimationFrame(tick);
            }
            return;
          }
          const target = applyScrollY(activePath, effectiveY);
          if (Math.abs(window.scrollY - target) > 10) {
            applyScrollY(activePath, effectiveY);
          }
        }

        attempts += 1;
        const liveStored = readTransactionScrollY(activePath);
        const done =
          effectiveY === null || effectiveY <= 0
            ? window.scrollY <= 4 && stableHeightPasses >= 1
            : Math.abs(
                window.scrollY -
                  clampTransactionScrollTarget(
                    effectiveY,
                    height,
                    window.innerHeight,
                  ),
              ) <= 10 && stableHeightPasses >= 1;

        if (!done && attempts < maxAttempts) {
          window.requestAnimationFrame(tick);
        }
      };

      tick();
      return () => {
        cancelled = true;
      };
    };

    recordCoachScrollRestorationOriginal();
    try {
      history.scrollRestoration = "manual";
    } catch {
      // ignore
    }

    const path = pathnameRef.current;
    if (window.scrollY > 0) {
      lastScrollYRef.current = window.scrollY;
      writeTransactionScrollY(window.scrollY, path);
    }
    const storedY = readTransactionScrollY(path);
    const cancelRestore = restoreUntilStable(path, storedY);

    const restoreFromStorage = () => {
      if (!isTransactionScrollPath(pathnameRef.current)) {
        return;
      }
      const y = readTransactionScrollY(pathnameRef.current);
      restoreUntilStable(pathnameRef.current, y);
    };

    const onPopState = () => {
      restoreFromStorage();
    };
    window.addEventListener("popstate", onPopState);
    const onPageShow = () => {
      restoreFromStorage();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelRestore();
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname, onTransaction]);

  useEffect(() => {
    if (!onTransaction) {
      return;
    }
    let frame = 0;
    const onScroll = () => {
      if (!isTransactionScrollPath(pathnameRef.current)) {
        return;
      }
      const y = window.scrollY;
      if (y > 0) {
        lastScrollYRef.current = y;
        writeTransactionScrollY(y, pathnameRef.current);
      }
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!isTransactionScrollPath(pathnameRef.current)) {
          return;
        }
        const latest = window.scrollY;
        if (latest > 0) {
          lastScrollYRef.current = latest;
          writeTransactionScrollY(latest, pathnameRef.current);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const saveScroll = () => {
      const y = Math.max(window.scrollY, lastScrollYRef.current);
      lastScrollYRef.current = y;
      writeTransactionScrollY(y, pathname);
    };
    const onLeavingPointer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (
        anchor instanceof HTMLAnchorElement &&
        shouldSaveScrollForLink(anchor)
      ) {
        saveScroll();
      }
    };
    document.addEventListener("pointerdown", onLeavingPointer, true);
    document.addEventListener("mousedown", onLeavingPointer, true);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onLeavingPointer, true);
      document.removeEventListener("mousedown", onLeavingPointer, true);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, onTransaction]);

  return null;
}
