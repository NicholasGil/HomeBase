"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { endTestSessionFromForm } from "@/app/actions/test-session";
import { Badge } from "@/components/ui/badge";
import type { AppNavRole } from "@/lib/app-nav";

export function ProfileMenu({
  name,
  role,
  fixtureSignOut,
}: {
  name: string;
  role: Exclude<AppNavRole, "guest">;
  fixtureSignOut?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-testid="profile-avatar"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
        onClick={() => setOpen((current) => !current)}
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-foreground text-eyebrow font-medium text-background"
        >
          {name.slice(0, 1)}
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          data-testid="profile-menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-64 rounded-xl bg-card p-3 shadow-[0_8px_24px_rgba(15,23,42,0.12)] ring-1 ring-black/8"
        >
          <div className="space-y-1 px-1.5 pb-3">
            <p className="text-sm font-medium">{name}</p>
            <Badge variant="sage">{role}</Badge>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            className="flex min-h-11 items-center rounded-full px-3 text-sm text-foreground transition-colors hover:bg-sage hover:text-sage-foreground"
            onClick={() => setOpen(false)}
          >
            Profile settings
          </Link>
          {fixtureSignOut ? (
            <form action={endTestSessionFromForm}>
              <button
                type="submit"
                role="menuitem"
                className="flex min-h-11 w-full items-center rounded-full px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-sand hover:text-sand-foreground"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
