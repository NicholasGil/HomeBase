import { endTestSessionFromForm } from "@/app/actions/test-session";
import { isDemoMode } from "@/lib/auth-config";

export function DemoShellBadge() {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <div
      className="flex h-7 max-w-[min(100%,11rem)] shrink items-center gap-0.5 rounded-full border border-sand/80 bg-sand/30 pl-2 pr-0.5 text-[11px] font-medium leading-none text-foreground sm:max-w-none sm:gap-1 sm:px-2 sm:text-xs"
      data-testid="demo-shell-badge"
    >
      <span className="truncate whitespace-nowrap">
        <span className="hidden min-[400px]:inline">Demo · </span>
        sample data
      </span>
      <form action={endTestSessionFromForm} className="shrink-0">
        <button
          type="submit"
          className="inline-flex min-h-11 min-w-11 items-center justify-center px-1.5 text-[11px] underline decoration-muted-foreground/60 underline-offset-2 hover:text-foreground"
          data-testid="demo-exit-link"
        >
          Exit demo
        </button>
      </form>
    </div>
  );
}
