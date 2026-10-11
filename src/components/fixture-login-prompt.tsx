import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  BUYER_PREVIEW_FIXTURE_LOGIN,
  BUYER_SOLD_SIGN_IN,
  BUYER_SOLD_SIGN_UP,
} from "@/lib/buyer-auth-entry";
import { isDemoMode } from "@/lib/auth-config";
import {
  DEMO_CHOOSER_PATH,
  fixtureLoginPromptPreviewLabel,
} from "@/lib/demo-copy";
import { cn } from "@/lib/utils";

export function FixtureLoginPrompt() {
  const demo = isDemoMode();
  const fixtureHref = demo ? DEMO_CHOOSER_PATH : BUYER_PREVIEW_FIXTURE_LOGIN;
  const signInHref = demo ? DEMO_CHOOSER_PATH : BUYER_SOLD_SIGN_IN;
  const signUpHref = demo ? DEMO_CHOOSER_PATH : BUYER_SOLD_SIGN_UP;

  return (
    <div className="space-y-4" data-testid="fixture-login-prompt">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        {demo
          ? "Choose a demo persona to explore RealtyRise with sample data—buyer coach, agent command center, vendor portal, and brokerage onboarding."
          : "Buyers use Clerk to open the personal coach at "}
        {!demo ? (
          <>
            <Link className="underline" href="/coach">/coach</Link>. Sign in or
            create an account below. Fixture login is for preview, CI, and agents
            only when Clerk keys are not configured here.
          </>
        ) : null}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={signInHref}
          data-testid="fixture-login-prompt-sign-in"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
        >
          Sign in
        </Link>
        <Link
          href={signUpHref}
          data-testid="fixture-login-prompt-sign-up"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-full",
          )}
        >
          Create account
        </Link>
      </div>
      <Link
        href={fixtureHref}
        data-testid="fixture-login-prompt-preview"
        className="text-sm text-muted-foreground underline"
      >
        {fixtureLoginPromptPreviewLabel()}
      </Link>
    </div>
  );
}
