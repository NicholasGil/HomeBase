import { isCoachScrollPath } from "@/lib/coach-scroll-bootstrap-logic";

/** Whether a pageshow event should re-run coach scroll restore (bfcache). */
export function coachScrollRestoreOnPageShow(
  event: Pick<PageTransitionEvent, "persisted">,
  pathname: string,
): boolean {
  if (!isCoachScrollPath(pathname)) {
    return false;
  }
  return event.persisted;
}
