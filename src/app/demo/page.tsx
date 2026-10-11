import { AppShell } from "@/components/app-shell";
import { DemoPersonaChooser } from "@/components/demo-persona-chooser";
import {
  fixtureAllowed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  if (!fixtureAllowed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  return (
    <AppShell>
      <DemoPersonaChooser />
    </AppShell>
  );
}
