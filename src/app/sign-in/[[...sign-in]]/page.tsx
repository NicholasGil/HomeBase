import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { clerkSignInRedirectProps } from "@/lib/buyer-auth-funnel";
import { isClerkConfigured } from "@/lib/auth-config";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <AppShell>
        <div
          data-testid="sign-in-fixture-fallback"
          className="mx-auto flex max-w-lg flex-col gap-4 px-5 py-8"
        >
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Clerk keys are not set. Use the fixture login at{" "}
            <Link className="underline" href="/test-login">
              /test-login
            </Link>{" "}
            until a human creates the Clerk application.
          </p>
          <Link
            href="/test-login"
            data-testid="sign-in-fixture-fallback-cta"
            className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")}
          >
            Continue with fixture login
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-lg flex-col px-5 py-8">
        <SignIn
          {...clerkSignInRedirectProps()}
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none",
            },
          }}
        />
      </div>
    </AppShell>
  );
}
