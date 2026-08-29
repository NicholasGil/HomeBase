import { AppShell } from "@/components/app-shell";
import { assertCanRenderWithoutAuth } from "@/lib/auth-config";

export function RoleHome({
  role,
  phase,
}: {
  role: "agent" | "broker" | "admin" | "vendor";
  phase: string;
}) {
  assertCanRenderWithoutAuth();

  return (
    <AppShell>
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">{role} home</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Role routing lands {role}s here. The rest of this surface ships in{" "}
          {phase}.
        </p>
      </div>
    </AppShell>
  );
}
