import { redirect } from "next/navigation";

import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveProfileSettings } from "@/components/live-profile-settings";
import { ProfileSettings } from "@/components/profile-settings";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { wordmarkHrefFor } from "@/lib/app-nav";
import { fixtureContactForSession } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const session = await getTestSession();
  const mode = dashboardRenderMode(process.env, session);

  if (mode === "unavailable") {
    throw new ProductionAuthMisconfiguredError();
  }

  if (mode === "login") {
    return (
      <AppShell>
        <FixtureLoginPrompt />
      </AppShell>
    );
  }

  if (mode === "fixture") {
    if (session === null) {
      redirect("/test-login");
    }
    const contact = fixtureContactForSession(session);
    return (
      <AppShell>
        <ProfileSettings
          name={session.name}
          role={session.role}
          email={contact?.email}
          phone={contact?.phone}
          eyebrow="Fixture session · not Clerk"
          fixtureSignOut
          backHref={wordmarkHrefFor(session.role)}
          backLabel="Back"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            You cannot open this profile.
          </p>
        }
      >
        <LiveProfileSettings />
      </QueryErrorBoundary>
    </AppShell>
  );
}
