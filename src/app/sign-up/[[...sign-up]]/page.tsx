import { SignUp } from "@clerk/nextjs";

import { AppShell } from "@/components/app-shell";
import { isClerkConfigured } from "@/lib/auth-config";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <AppShell>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Clerk keys are not set. Do not invent production credentials.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SignUp />
    </AppShell>
  );
}
