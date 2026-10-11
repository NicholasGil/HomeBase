import { endTestSessionFromForm } from "@/app/actions/test-session";
import { isDemoMode } from "@/lib/auth-config";

export function DemoShellBadge() {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-full border border-sand/80 bg-sand/30 px-2.5 py-1 text-xs font-medium text-foreground"
      data-testid="demo-shell-badge"
    >
      <span>Demo · sample data</span>
      <form action={endTestSessionFromForm}>
        <button
          type="submit"
          className="underline decoration-muted-foreground/60 underline-offset-2 hover:text-foreground"
          data-testid="demo-exit-link"
        >
          Exit demo
        </button>
      </form>
    </div>
  );
}
