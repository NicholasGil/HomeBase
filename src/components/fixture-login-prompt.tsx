import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  BUYER_PREVIEW_FIXTURE_LOGIN,
  BUYER_SOLD_SIGN_IN,
  BUYER_SOLD_SIGN_UP,
} from "@/lib/buyer-auth-entry";
import { cn } from "@/lib/utils";

export function FixtureLoginPrompt() {
  return (
    <div className="space-y-4" data-testid="fixture-login-prompt">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        Buyers use Clerk to open the personal coach at{" "}
        <Link className="underline" href="/coach">/coach</Link>. Sign in or
        create an account below. Fixture login is for preview, CI, and agents
        only when Clerk keys are not configured here.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={BUYER_SOLD_SIGN_IN}
          data-testid="fixture-login-prompt-sign-in"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
        >
          Sign in
        </Link>
        <Link
          href={BUYER_SOLD_SIGN_UP}
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
        href={BUYER_PREVIEW_FIXTURE_LOGIN}
        data-testid="fixture-login-prompt-preview"
        className="text-sm text-muted-foreground underline"
      >
        Preview fixture sign in
      </Link>
    </div>
  );
}
