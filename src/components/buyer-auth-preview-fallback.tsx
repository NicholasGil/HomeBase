import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  BUYER_PREVIEW_FIXTURE_LOGIN,
  BUYER_SOLD_SIGN_IN,
  BUYER_SOLD_SIGN_UP,
} from "@/lib/buyer-auth-entry";
import { cn } from "@/lib/utils";

type BuyerAuthPreviewFallbackProps = {
  mode: "sign-in" | "sign-up";
};

export function BuyerAuthPreviewFallback({ mode }: BuyerAuthPreviewFallbackProps) {
  const isSignIn = mode === "sign-in";

  return (
    <div
      data-testid={isSignIn ? "sign-in-fixture-fallback" : "sign-up-fixture-fallback"}
      className="mx-auto flex max-w-lg flex-col gap-4 px-5 py-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight">
        {isSignIn ? "Sign in" : "Create your account"}
      </h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        {isSignIn
          ? "Buyers sign in with Clerk and land on your personal coach at "
          : "Buyers create an account with Clerk and start on your personal coach at "}
        <Link className="underline" href="/coach">/coach</Link>. Clerk keys are
        not set in this environment (production keys are needs-human #1).
      </p>
      <div className="flex flex-col gap-3">
        {isSignIn ? (
          <Link
            href={BUYER_SOLD_SIGN_UP}
            data-testid="sign-in-sold-path-cta"
            className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")}
          >
            New buyer? Create account
          </Link>
        ) : (
          <p
            className={cn(
              buttonVariants({ size: "lg" }),
              "pointer-events-none w-full rounded-full opacity-60",
            )}
            aria-disabled="true"
          >
            Create account with Clerk
          </p>
        )}
        {!isSignIn ? (
          <Link
            href={BUYER_SOLD_SIGN_IN}
            data-testid="sign-up-sold-path-secondary"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full rounded-full",
            )}
          >
            Already have an account? Sign in
          </Link>
        ) : null}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Preview, CI, and agents only — not the buyer product path:
      </p>
      <Link
        href={BUYER_PREVIEW_FIXTURE_LOGIN}
        data-testid={
          isSignIn ? "sign-in-preview-fixture-cta" : "sign-up-preview-fixture-cta"
        }
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "w-full rounded-full border border-border/80",
        )}
      >
        Fixture sign in (preview)
      </Link>
    </div>
  );
}
