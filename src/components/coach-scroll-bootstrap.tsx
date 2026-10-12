"use client";

import { InlineScript } from "@/components/inline-script";
import { coachScrollBootstrapScript } from "@/lib/coach-scroll-bootstrap-script";
import { ensureTransactionScrollPopstateListener } from "@/lib/transaction-scroll-pop-navigation";

ensureTransactionScrollPopstateListener();

export function CoachScrollBootstrap() {
  return <InlineScript html={coachScrollBootstrapScript()} />;
}
