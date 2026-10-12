import { isTransactionScrollPath } from "@/lib/transaction-scroll-storage";

export function transactionScrollRestoreOnPageShow(
  event: Pick<PageTransitionEvent, "persisted">,
  pathname: string,
): boolean {
  if (!isTransactionScrollPath(pathname)) {
    return false;
  }
  return event.persisted;
}
