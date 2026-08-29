import { AppShell } from "@/components/app-shell";

export function RoleHome({
  role,
  phase,
}: {
  role: "agent" | "broker" | "admin" | "vendor";
  phase: string;
}) {
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
