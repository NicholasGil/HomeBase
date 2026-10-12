"use client";

import { InlineScript } from "@/components/inline-script";
import { coachScrollBootstrapScript } from "@/lib/coach-scroll-bootstrap-script";

export function CoachScrollBootstrap() {
  return <InlineScript html={coachScrollBootstrapScript()} />;
}
