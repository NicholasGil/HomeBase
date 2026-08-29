import { AppShell } from "@/components/app-shell";
import { RoleRouter } from "@/components/role-router";
import { assertCanRenderWithoutAuth, isAuthConfigured } from "@/lib/auth-config";

export default function AppPage() {
  if (!isAuthConfigured()) {
    assertCanRenderWithoutAuth();
    return (
      <AppShell>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Role routing</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            After Clerk is connected, this page reads <code>me.getSession</code>{" "}
            and sends buyer, agent, broker, admin, and vendor to their home
            route. Local preview: buyers use{" "}
            <a className="underline" href="/dashboard">
              /dashboard
            </a>
            .
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RoleRouter />
    </AppShell>
  );
}
