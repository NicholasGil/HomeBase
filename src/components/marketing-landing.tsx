import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_JOURNEY_STAGES,
  TEN_SECOND_QUESTIONS,
} from "@/lib/domain";
import {
  BUYER_SOLD_SIGN_IN,
  BUYER_SOLD_SIGN_UP,
} from "@/lib/buyer-auth-entry";
import { cn } from "@/lib/utils";

export function MarketingLanding() {
  return (
    <div className="min-h-full bg-background" data-testid="marketing-landing">
      <header className="border-b border-border/80">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm font-semibold tracking-tight">RealtyRise</p>
          <Link
            href={BUYER_SOLD_SIGN_IN}
            data-testid="marketing-header-sign-in"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "h-11 min-h-11 shrink-0 rounded-full px-4",
            )}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main
        className="mx-auto flex max-w-lg flex-col gap-12 px-5 py-8 pb-12"
        data-testid="marketing-landing-main"
      >
        <section
          className="space-y-5 rounded-2xl border border-border/80 bg-card px-5 py-6 shadow-sm"
          data-testid="marketing-hero"
        >
          <p className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Buyer side · one brokerage · one market
          </p>
          <div className="space-y-3">
            <h1 className="text-h1 font-semibold tracking-tight text-balance text-foreground">
              The operating system for buying a home
            </h1>
            <p className="text-pretty text-body text-muted-foreground">
              RealtyRise carries you from first search through closing and into
              homeownership — with one clear place to see where you are, what is
              done, what is next, and who you are waiting on.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={BUYER_SOLD_SIGN_UP}
              data-testid="marketing-cta-sign-up"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 min-h-11 w-full rounded-full shadow-[0_8px_20px_rgba(15,23,42,0.12)]",
              )}
            >
              Create your account
            </Link>
            <Link
              href="/pricing"
              data-testid="marketing-cta-pricing"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 min-h-11 w-full rounded-full",
              )}
            >
              See pricing
            </Link>
            <Link
              href={BUYER_SOLD_SIGN_IN}
              data-testid="marketing-cta-sign-in"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-11 min-h-11 w-full rounded-full border border-border/80",
              )}
            >
              Sign in
            </Link>
          </div>
        </section>

        <section id="clarity" className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-h2 font-semibold tracking-tight">
              Clarity in ten seconds
            </h2>
            <p className="text-pretty text-body text-muted-foreground">
              Open your coach cold. You should immediately know the five things
              that matter on your purchase — without digging through email or
              spreadsheets.
            </p>
          </div>
          <div className="grid gap-3">
            {TEN_SECOND_QUESTIONS.map((question) => (
              <Card key={question.key} size="sm">
                <CardHeader>
                  <CardTitle>{question.label}</CardTitle>
                  <CardDescription>{question.detail}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="journey" className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-h2 font-semibold tracking-tight">
              Your journey, end to end
            </h2>
            <p className="text-pretty text-body text-muted-foreground">
              Stages follow your agent and market. This is the default path
              buyers walk from discovery through move-in.
            </p>
          </div>
          <ol className="grid gap-2">
            {DEFAULT_JOURNEY_STAGES.map((stage) => (
              <li
                key={stage.key}
                className="flex items-center gap-3 rounded-xl border border-border/80 bg-card px-3 py-2.5 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(stage.order).padStart(2, "0")}
                </span>
                <span className="font-medium">{stage.label}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border/80">
        <div className="mx-auto max-w-lg px-5 py-6 text-center text-small text-muted-foreground">
          <p className="font-medium text-foreground">RealtyRise</p>
          <p className="mt-1">Your buyer transaction operating system.</p>
        </div>
      </footer>
    </div>
  );
}
