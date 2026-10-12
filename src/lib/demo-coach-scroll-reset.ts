import { nextCoachScrollEpoch } from "@/lib/coach-scroll-epoch";

/** Set on /demo/enter success; client syncs epoch + clears coach depth once on /coach. */
export const DEMO_COACH_SCROLL_RESET_COOKIE = "hb_demo_clear_coach_scroll";

export function demoCoachScrollResetCookieOptions(
  env: Pick<NodeJS.ProcessEnv, "NODE_ENV"> = process.env,
) {
  return {
    path: "/",
    maxAge: 120,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    httpOnly: false,
  };
}

export function demoCoachScrollResetCookieValue(): string {
  return "1";
}

export { nextCoachScrollEpoch };
