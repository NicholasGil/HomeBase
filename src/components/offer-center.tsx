import { Lock, ShieldCheck } from "lucide-react";

import { submitOfferFromForm } from "@/app/actions/offers";
import { ESIGN_NOT_ENABLED } from "../../convex/lib/esign";
import { getFeatureFlags } from "@/lib/flags";
import {
  ASSUMPTIONS_PANEL_ID,
  MoneyFigureView,
} from "@/components/money-figure-view";
import { OfferCostSimulator } from "@/components/offer-cost-simulator";
import {
  OfferStatusRail,
  offerRailSteps,
} from "@/components/offer-status-rail";
import { AccessDeniedCard } from "@/components/access-denied-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OfferCenterView } from "@/lib/offer-access";
import { tripHeadingClassName } from "@/lib/trip-ui";

const ASSUMPTIONS_HREF = `#${ASSUMPTIONS_PANEL_ID}`;

const STRATEGY_TAGLINE: Record<string, string> = {
  stronger: "Optimized toward competitiveness",
  balanced: "Price against buyer protections",
  value: "Favorable economics, higher rejection risk",
};

export function OfferCenterViewPanel({
  center,
  denied,
  gateFromSubmit,
  submitControl,
  esignEnabled,
}: {
  center: OfferCenterView | null;
  denied?: boolean;
  gateFromSubmit?: string | null;
  submitControl?: React.ReactNode;
  /** Live callers pass the flag they already hold; fixture falls back to the server read. */
  esignEnabled?: boolean;
}) {
  if (denied || center === null) {
    return (
      <AccessDeniedCard testId="offer-denied" title="You cannot open this offer." />
    );
  }

  const esignOn = esignEnabled ?? getFeatureFlags().FLAG_ESIGN;
  const railSteps = offerRailSteps({
    offer: center.offer,
    esignEnabled: esignOn,
  });
  const gateReason =
    gateFromSubmit === ESIGN_NOT_ENABLED
      ? (center.offer?.gate.reason ?? "LICENSEE_REVIEW_REQUIRED")
      : (gateFromSubmit ??
        center.offer?.gate.reason ??
        "LICENSEE_REVIEW_REQUIRED");

  return (
    <section className="space-y-8" data-testid="offer-center">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className={tripHeadingClassName}>Offer center</h2>
          <p className="text-sm text-muted-foreground">
            Market context from seeded comps and listing fields. Sample data
            only.
          </p>
        </div>
        <Badge variant="sage">{center.market.sampleData}</Badge>
      </div>

      <Card data-testid="offer-market">
        <CardHeader>
          <CardTitle>Pre-offer market context</CardTitle>
          <CardDescription>
            {center.propertyAddress.line1}, {center.propertyAddress.city} ·{" "}
            {center.market.sampleData}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Days on market</p>
            <p data-testid="days-on-market">{center.market.daysOnMarket}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">List price</p>
            <MoneyFigureView
              figure={center.market.listPrice}
              testId="list-price"
              size="md"
              showLabel={false}
              assumptionsHref={ASSUMPTIONS_HREF}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price reductions</p>
            <p data-testid="price-reductions">
              {center.market.priceReductions.length === 0
                ? "None on this sample listing"
                : `${center.market.priceReductions.length} reduction`}
            </p>
            {center.market.priceReductions.map((row) => (
              <MoneyFigureView
                key={row.reducedAt}
                figure={row.newPrice}
                testId="price-reduction"
                size="sm"
                assumptionsHref={ASSUMPTIONS_HREF}
              />
            ))}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Competing inventory</p>
            <p data-testid="competing-inventory">
              {center.market.competingInventory.count} ·{" "}
              {center.market.competingInventory.label}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Estimated position</p>
            <p data-testid="estimated-position">
              {center.market.estimatedPosition.label}
            </p>
            {center.market.estimatedPosition.averageComp ? (
              <MoneyFigureView
                figure={center.market.estimatedPosition.averageComp}
                testId="average-comp"
                size="sm"
                assumptionsHref={ASSUMPTIONS_HREF}
              />
            ) : null}
          </div>
          <div className="md:col-span-2 space-y-2">
            <p className="text-sm text-muted-foreground">Sample comps</p>
            {center.market.comps.map((comp) => (
              <div key={comp.address.line1} className="space-y-1">
                <p className="text-sm">
                  {comp.address.line1}, {comp.address.city} · {comp.source}
                </p>
                <MoneyFigureView
                  figure={comp.soldPrice}
                  size="sm"
                  showLabel={false}
                  assumptionsHref={ASSUMPTIONS_HREF}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight">
            Three modeled strategies
          </h3>
          <p className="text-xs text-muted-foreground md:hidden">
            Swipe to compare
          </p>
        </div>
        <div
          data-testid="scenario-rail"
          className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
        >
          {center.scenarios.map((scenario) => (
            <Card
              key={scenario.strategy}
              data-testid={`scenario-${scenario.strategy}`}
              className="w-[85vw] shrink-0 snap-start md:w-auto md:shrink"
            >
              <CardHeader>
                <CardTitle className="capitalize">{scenario.strategy}</CardTitle>
                <CardDescription>
                  {STRATEGY_TAGLINE[scenario.strategy] ??
                    "Modeled terms and tradeoffs"}
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MoneyFigureView
                figure={scenario.terms.price}
                testId={`${scenario.strategy}-price`}
                size="md"
                assumptionsHref={ASSUMPTIONS_HREF}
              />
              {scenario.terms.earnestMoney ? (
                <MoneyFigureView
                  figure={scenario.terms.earnestMoney}
                  testId={`${scenario.strategy}-earnest`}
                  size="sm"
                  assumptionsHref={ASSUMPTIONS_HREF}
                />
              ) : null}
              {scenario.terms.sellerConcessions ? (
                <MoneyFigureView
                  figure={scenario.terms.sellerConcessions}
                  testId={`${scenario.strategy}-concessions`}
                  size="sm"
                  assumptionsHref={ASSUMPTIONS_HREF}
                />
              ) : null}
              <MoneyFigureView
                figure={scenario.modeledOutcome.cashToClose}
                testId={`${scenario.strategy}-cash`}
                size="sm"
                assumptionsHref={ASSUMPTIONS_HREF}
              />
              <MoneyFigureView
                figure={scenario.modeledOutcome.monthlyPayment}
                testId={`${scenario.strategy}-monthly`}
                size="sm"
                assumptionsHref={ASSUMPTIONS_HREF}
              />
              <p>
                Close in{" "}
                {scenario.terms.closingDate
                  ? new Date(scenario.terms.closingDate).toDateString()
                  : "n/a"}
              </p>
              <p>
                Financing {scenario.terms.financing?.program ?? "n/a"} ·
                inspection {scenario.terms.inspectionTerms?.periodDays ?? 0} days
                · {scenario.terms.inspectionTerms?.repairs ?? "n/a"}
              </p>
              <p>
                Contingencies: inspection{" "}
                {scenario.terms.contingencies?.inspection ? "yes" : "no"},
                financing{" "}
                {scenario.terms.contingencies?.financing ? "yes" : "no"},
                appraisal{" "}
                {scenario.terms.contingencies?.appraisal ? "yes" : "no"}
              </p>
              <ul className="list-disc space-y-1 pl-4" data-testid={`${scenario.strategy}-tradeoffs`}>
                {scenario.tradeoffs.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          ))}
        </div>
      </div>

      <Card data-testid="offer-gate" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Draft and licensee review</CardTitle>
          <CardDescription>
            No offer leaves draft without a licensee review on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p data-testid="offer-status" className="text-sm font-medium">
            {center.offer
              ? `Status ${center.offer.status}`
              : "No draft yet"}
          </p>
          <p
            data-testid="licensee-gate"
            data-gate={gateReason}
            className="flex items-start gap-2.5 rounded-lg bg-sand/70 px-3 py-2.5 text-sm leading-snug text-sand-foreground ring-1 ring-sand-foreground/10"
          >
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {gateReason === "LICENSEE_REVIEW_REQUIRED"
                ? "A licensee must review this offer before it can leave draft."
                : gateReason === "already_submitted"
                  ? "This offer is already submitted."
                  : gateReason === "denied"
                    ? "You cannot submit this offer."
                    : "Ready for licensee-approved submit."}
            </span>
          </p>
          <OfferStatusRail steps={railSteps} />
          {submitControl ??
            (esignOn ? (
              <form action={submitOfferFromForm}>
                <Button type="submit" data-testid="submit-offer">
                  Submit offer
                </Button>
              </form>
            ) : (
              <p
                data-testid="submit-offer-gated"
                className="flex items-start gap-2.5 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
              >
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  E-signature is off. Offers cannot be submitted until
                  FLAG_ESIGN is enabled.
                </span>
              </p>
            ))}
        </CardContent>
      </Card>

      <OfferCostSimulator listPriceCents={center.market.listPrice.amountCents} />
    </section>
  );
}

export function FixtureOfferCenter({
  center,
  denied,
  gateFromSubmit,
}: {
  center: OfferCenterView | null;
  denied?: boolean;
  gateFromSubmit?: string | null;
}) {
  return (
    <OfferCenterViewPanel
      center={center}
      denied={denied}
      gateFromSubmit={gateFromSubmit}
    />
  );
}
