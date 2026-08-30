import { SignIn } from "@clerk/nextjs";

import { AppShell } from "@/components/app-shell";
import { isClerkConfigured } from "@/lib/auth-config";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <AppShell>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Clerk keys are not set. Use the fixture login at{" "}
            <a className="underline" href="/test-login">
              /test-login
            </a>{" "}
            until a human creates the Clerk application.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SignIn />
    </AppShell>
  );
}
