import { endTestSessionFromForm } from "@/app/actions/test-session";
import { isDemoMode } from "@/lib/auth-config";

export function DemoShellBadge() {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <div
      className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-sand/80 bg-sand/30 px-3 py-2 text-xs font-medium text-foreground"
      data-testid="demo-shell-badge"
    >
      <span className="whitespace-nowrap">Demo · sample data</span>
      <form action={endTestSessionFromForm}>
        <button
          type="submit"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 underline decoration-muted-foreground/60 underline-offset-2 hover:text-foreground"
          data-testid="demo-exit-link"
        >
          Exit demo
        </button>
      </form>
    </div>
  );
}
