import { COACH_SCROLL_STORAGE_KEY } from "@/lib/coach-scroll-key";
import { coachScrollBootstrapScriptBody } from "@/lib/coach-scroll-bootstrap-logic";

/** Runs before first paint on /coach to restore scrollY (back, tab return, reload). */
export function coachScrollBootstrapScript(): string {
  const body = coachScrollBootstrapScriptBody(COACH_SCROLL_STORAGE_KEY);
  return `(function(){${body}})();`;
}
