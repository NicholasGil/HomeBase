import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  BUYER_AUTH_PREVIEW_CREATE_ACCOUNT_LABEL,
  BUYER_AUTH_PREVIEW_ENV_TAIL,
  BUYER_AUTH_PREVIEW_SIGN_IN_LEAD,
  BUYER_AUTH_PREVIEW_SIGN_UP_LEAD,
} from "@/lib/buyer-auth-guest-copy";
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
      <h1 className="text-h1 font-semibold tracking-tight">
        {isSignIn ? "Sign in" : "Create your account"}
      </h1>
      <div className="space-y-3">
        <p
          data-testid="buyer-auth-env-notice"
          className="max-w-xl text-pretty text-body text-muted-foreground"
        >
          {isSignIn ? BUYER_AUTH_PREVIEW_SIGN_IN_LEAD : BUYER_AUTH_PREVIEW_SIGN_UP_LEAD}{" "}
          {BUYER_AUTH_PREVIEW_ENV_TAIL}
        </p>
        <Link
          href="/coach"
          data-testid="buyer-auth-coach-link"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 min-h-11 w-full max-w-full rounded-full px-4",
          )}
        >
          Open personal coach
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {isSignIn ? (
          <Link
            href={BUYER_SOLD_SIGN_UP}
            data-testid="sign-in-sold-path-cta"
            className={cn(buttonVariants({ size: "lg" }), "h-11 min-h-11 w-full rounded-full")}
          >
            New buyer? Create account
          </Link>
        ) : (
          <p
            className={cn(
              buttonVariants({ size: "lg" }),
              "pointer-events-none h-11 min-h-11 w-full rounded-full opacity-60",
            )}
            aria-disabled="true"
          >
            {BUYER_AUTH_PREVIEW_CREATE_ACCOUNT_LABEL}
          </p>
        )}
        {!isSignIn ? (
          <Link
            href={BUYER_SOLD_SIGN_IN}
            data-testid="sign-up-sold-path-secondary"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 min-h-11 w-full rounded-full",
            )}
          >
            Already have an account? Sign in
          </Link>
        ) : null}
      </div>
      <p className="text-small text-muted-foreground">
        Preview, CI, and agents only — not the buyer product path:
      </p>
      <Link
        href={BUYER_PREVIEW_FIXTURE_LOGIN}
        data-testid={
          isSignIn ? "sign-in-preview-fixture-cta" : "sign-up-preview-fixture-cta"
        }
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "h-11 min-h-11 w-full rounded-full border border-border/80",
        )}
      >
        Fixture sign in (preview)
      </Link>
    </div>
  );
}
