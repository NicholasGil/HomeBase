"use client";

import { useLayoutEffect, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  clampTransactionScrollTarget,
  isTransactionScrollPath,
  persistTransactionScrollOnLeave,
  readTransactionScrollY,
  writeTransactionScrollY,
} from "@/lib/transaction-scroll-storage";
import { isCoachScrollPath } from "@/lib/coach-scroll-bootstrap-logic";
import {
  recordCoachScrollRestorationOriginal,
  resetCoachScrollRestorationToAuto,
} from "@/lib/coach-scroll-restoration-window";
import {
  clearTransactionScrollPopNavigation,
  consumeTransactionScrollPopNavigation,
  ensureTransactionScrollPopstateListener,
} from "@/lib/transaction-scroll-pop-navigation";
import { transactionScrollRestoreOnPageShow } from "@/lib/transaction-scroll-pageshow";

ensureTransactionScrollPopstateListener();

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
  const lastScrollYByPathRef = useRef<Map<string, number>>(new Map());
  const userScrolledRef = useRef(false);
  const blockZeroSaveUntilRef = useRef(0);

  const lastYForPath = (path: string): number =>
    lastScrollYByPathRef.current.get(path) ?? 0;

  const setLastYForPath = (path: string, y: number) => {
    lastScrollYByPathRef.current.set(path, y);
  };

  const seedLastYFromStorage = (path: string) => {
    const stored = readTransactionScrollY(path);
    setLastYForPath(path, stored !== null && stored > 0 ? stored : 0);
  };

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
    blockZeroSaveUntilRef.current = Date.now() + 500;
    setLastYForPath(path, target);
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

    const mountPath = pathname;
    userScrolledRef.current = false;
    seedLastYFromStorage(mountPath);

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

    let cancelRestore = () => {};

    const restoreFromStorage = () => {
      if (!isTransactionScrollPath(pathnameRef.current)) {
        return;
      }
      cancelRestore();
      const y = readTransactionScrollY(pathnameRef.current);
      if (y !== null && y > 0) {
        setLastYForPath(pathnameRef.current, y);
      }
      cancelRestore = restoreUntilStable(pathnameRef.current, y);
    };

    const onPopState = () => {
      pathnameRef.current = window.location.pathname;
      if (!isTransactionScrollPath(pathnameRef.current)) {
        return;
      }
      userScrolledRef.current = false;
      seedLastYFromStorage(pathnameRef.current);
      restoreFromStorage();
      clearTransactionScrollPopNavigation();
    };
    window.addEventListener("popstate", onPopState);

    if (consumeTransactionScrollPopNavigation(mountPath)) {
      restoreFromStorage();
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (
        !transactionScrollRestoreOnPageShow(
          event,
          window.location.pathname,
        )
      ) {
        return;
      }
      restoreFromStorage();
    };
    window.addEventListener("pageshow", onPageShow);

    const onPageHide = () => {
      const path = window.location.pathname;
      if (!isTransactionScrollPath(path)) {
        return;
      }
      persistTransactionScrollOnLeave(
        window.scrollY,
        lastYForPath(path),
        path,
      );
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelRestore();
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
      if (isTransactionScrollPath(mountPath)) {
        persistTransactionScrollOnLeave(
          window.scrollY,
          lastYForPath(mountPath),
          mountPath,
        );
      }
      if (!isCoachScrollPath(window.location.pathname)) {
        resetCoachScrollRestorationToAuto();
      }
    };
  }, [pathname, onTransaction]);

  useEffect(() => {
    if (!onTransaction) {
      return;
    }
    userScrolledRef.current = false;
    document.documentElement.dataset.txnScrollListen = "1";

    const markUserScroll = () => {
      if (!restoringRef.current) {
        userScrolledRef.current = true;
      }
    };
    window.addEventListener("wheel", markUserScroll, { passive: true });
    window.addEventListener("touchmove", markUserScroll, { passive: true });
    window.addEventListener("keydown", markUserScroll);

    let frame = 0;
    const onScroll = () => {
      const path = pathnameRef.current;
      if (!isTransactionScrollPath(path)) {
        return;
      }
      const y = window.scrollY;
      if (y > 0) {
        setLastYForPath(path, y);
        writeTransactionScrollY(y, path);
      }
      if (restoringRef.current) {
        return;
      }
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (restoringRef.current) {
          return;
        }
        const activePath = pathnameRef.current;
        if (!isTransactionScrollPath(activePath)) {
          return;
        }
        const latest = window.scrollY;
        if (latest > 0) {
          setLastYForPath(activePath, latest);
          writeTransactionScrollY(latest, activePath);
          return;
        }
        if (Date.now() < blockZeroSaveUntilRef.current) {
          return;
        }
        const prev = readTransactionScrollY(activePath);
        if (prev !== null && prev > 0 && !userScrolledRef.current) {
          return;
        }
        if (userScrolledRef.current && lastYForPath(activePath) > 0) {
          userScrolledRef.current = false;
        }
        setLastYForPath(activePath, 0);
        writeTransactionScrollY(0, activePath, { forceZero: true });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

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
        const path = pathnameRef.current;
        if (!isTransactionScrollPath(path)) {
          return;
        }
        persistTransactionScrollOnLeave(
          window.scrollY,
          lastYForPath(path),
          path,
        );
      }
    };
    document.addEventListener("pointerdown", onLeavingPointer, true);
    document.addEventListener("mousedown", onLeavingPointer, true);

    return () => {
      delete document.documentElement.dataset.txnScrollListen;
      window.removeEventListener("wheel", markUserScroll);
      window.removeEventListener("touchmove", markUserScroll);
      window.removeEventListener("keydown", markUserScroll);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onLeavingPointer, true);
      document.removeEventListener("mousedown", onLeavingPointer, true);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, onTransaction]);

  return null;
}
