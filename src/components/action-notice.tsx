import { formNoticeMessage } from "@/lib/form-notices";

export function ActionNotice({ notice }: { notice?: string }) {
  const message = formNoticeMessage(notice);
  if (message === null) {
    return null;
  }
  return (
    <p
      data-testid="action-notice"
      data-notice={notice}
      className="rounded-lg border bg-sage/40 px-4 py-3 text-sm"
    >
      {message}
    </p>
  );
}
