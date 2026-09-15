import Link from "next/link";

import { BuyerLockedUpsellCard } from "@/components/buyer-locked-upsell";
import { buttonVariants } from "@/components/ui/button";
import { BUYER_LOCKED_UPSELLS } from "@/lib/buyer-shell";
import {
  COACH_ENTRY_PRICE_LABEL,
  COACH_ENTRY_PRICE_MONTHLY_USD,
  PRICING_BILLING_DISCLAIMER,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

function ContinueCoachLink({
  href,
  testId,
  className,
}: {
  href: string;
  testId: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className={cn(
        buttonVariants({ variant: "default", size: "lg" }),
        "w-full rounded-full",
        className,
      )}
    >
      Continue with coach
    </Link>
  );
}

export function PricingPageContent({
  continueCoachHref,
}: {
  continueCoachHref: string;
}) {
  return (
    <div
      data-testid="pricing-page"
      className="mx-auto flex max-w-lg flex-col gap-8 px-5 py-8 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+1.5rem)] md:pb-8"
    >
      <header className="space-y-3">
        <p className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Simple entry
        </p>
        <h1 className="text-display font-semibold tracking-tight text-balance">
          Personal coach entry{" "}
          <span data-testid="pricing-coach-price">{COACH_ENTRY_PRICE_LABEL}</span>
        </h1>
        <p className="text-pretty text-body text-muted-foreground">
          One starting tier — like a gym membership for your home purchase. Your
          always-on coach is the entry point at{" "}
          <span className="font-medium text-foreground">
            ${COACH_ENTRY_PRICE_MONTHLY_USD}/month
          </span>
          . No plan matrix, no surprise add-ons on this page.
        </p>
        <ContinueCoachLink
          href={continueCoachHref}
          testId="pricing-continue-coach-hero"
        />
      </header>

      <section aria-labelledby="pricing-included-heading" className="space-y-3">
        <h2
          id="pricing-included-heading"
          className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase"
        >
          Included at {COACH_ENTRY_PRICE_LABEL}
        </h2>
        <div className="rounded-2xl border border-border/80 bg-card px-5 py-5 shadow-sm">
          <p className="text-body font-semibold tracking-tight">Personal coach</p>
          <p className="mt-2 text-pretty text-body text-muted-foreground">
            Your concierge entry: scoped to your file, explains what is happening
            in plain language, and never crosses into advice. This is the same
            coach experience on your HomeBase home — not a lite demo.
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-body text-muted-foreground">
            <li>Always-on Q&amp;A for your transaction file</li>
            <li>Stage-aware answers tied to your journey</li>
            <li>Mobile-first coach home and suggested questions</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="pricing-not-included-heading" className="space-y-3">
        <h2
          id="pricing-not-included-heading"
          className="text-eyebrow font-medium tracking-[0.12em] text-muted-foreground uppercase"
        >
          Not included — full OS upsells
        </h2>
        <p className="text-body text-muted-foreground">
          Search, Pipeline, Tours, and Vault stay locked until your agent or
          brokerage enables the full transaction OS.
        </p>
        <div className="space-y-3">
          {BUYER_LOCKED_UPSELLS.map((upsell) => (
            <BuyerLockedUpsellCard key={upsell.area} upsell={upsell} />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="pricing-cta-heading"
        className="space-y-4 rounded-2xl border border-border/80 bg-muted/30 px-5 py-6"
      >
        <h2 id="pricing-cta-heading" className="text-h2 font-semibold tracking-tight">
          Continue with coach
        </h2>
        <p
          data-testid="pricing-billing-disclaimer"
          className="text-pretty text-sm leading-6 text-muted-foreground"
        >
          {PRICING_BILLING_DISCLAIMER}
        </p>
        <ContinueCoachLink
          href={continueCoachHref}
          testId="pricing-continue-coach"
        />
      </section>
    </div>
  );
}
