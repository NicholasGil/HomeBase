import { seedCommandCenter } from "@/lib/seed-command-center";
import type { TestSession } from "@/lib/test-session";

export function loadSeedCommandCenterForViewer(
  session: TestSession | null,
  now = Date.now(),
) {
  if (session === null) {
    return { ok: false as const, reason: "UNAUTHENTICATED" as const };
  }
  if (session.role !== "agent") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return { ok: true as const, view: seedCommandCenter(now) };
}
