"use client";

import { MessageCircleQuestionMark, XIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { ConciergeChat } from "@/components/concierge-chat";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type ConciergeScope = {
  address: string;
  stage: string;
};

/* Tailwind `lg`; the sheet becomes a side panel from here up. */
const SIDE_PANEL_QUERY = "(min-width: 64rem)";

function subscribeToSidePanel(onChange: () => void) {
  const media = window.matchMedia(SIDE_PANEL_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readSidePanel() {
  return window.matchMedia(SIDE_PANEL_QUERY).matches;
}

/**
 * Global concierge entry point for buyers: a 56px FAB that sits above the
 * mobile tab bar (plus the device safe-area inset) and opens the chat in a
 * bottom sheet below `lg`, or a 420px right panel at `lg` and up. Rendering is
 * gated by role in AppShell, so agents and vendors never receive this tree.
 *
 * The side is chosen from a media query rather than responsive classes so the
 * primitive's own per-side positioning and enter/exit motion stay intact. The
 * popup only mounts after a tap, so the server snapshot never reaches paint.
 */
export function ConciergeSheet({ scope }: { scope: ConciergeScope }) {
  const [open, setOpen] = useState(false);
  const sidePanel = useSyncExternalStore(
    subscribeToSidePanel,
    readSidePanel,
    () => false,
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        data-testid="concierge-fab"
        aria-label="Ask the concierge"
        className="fixed right-4 bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+1rem)] z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(15,23,42,0.22)] transition-transform outline-none hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 md:right-6 md:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        <MessageCircleQuestionMark className="size-6" aria-hidden />
      </SheetTrigger>
      <SheetContent
        side={sidePanel ? "right" : "bottom"}
        showCloseButton={false}
        data-testid="concierge-sheet"
        className="gap-0 bg-background pb-[env(safe-area-inset-bottom)] data-[side=bottom]:h-[85vh] data-[side=bottom]:rounded-t-[28px] data-[side=right]:w-[420px] data-[side=right]:sm:max-w-none"
      >
        <div
          aria-hidden
          className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border lg:hidden"
        />
        <header
          data-testid="concierge-scope"
          className="flex shrink-0 items-start gap-3 border-b border-border/70 px-5 pt-3 pb-4 lg:pt-5"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Transaction concierge
            </p>
            <SheetTitle className="truncate text-base font-semibold tracking-tight">
              {scope.address}
            </SheetTitle>
            <SheetDescription className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
              <span className="inline-flex h-6 items-center rounded-full bg-sage px-2.5 text-xs font-medium text-sage-foreground">
                {scope.stage}
              </span>
              <span>Explains this file only. Never advises.</span>
            </SheetDescription>
          </div>
          <SheetClose
            aria-label="Close concierge"
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                className="size-11 shrink-0 rounded-full"
              />
            }
          >
            <XIcon className="size-5" aria-hidden />
          </SheetClose>
        </header>
        <ConciergeChat className="min-h-0 flex-1 px-5 pt-4 pb-3" />
      </SheetContent>
    </Sheet>
  );
}
