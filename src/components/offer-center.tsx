import { submitOfferFromForm } from "@/app/actions/offers";
import { ESIGN_NOT_ENABLED } from "../../convex/lib/esign";
import { getFeatureFlags } from "@/lib/flags";
import { MoneyFigureView } from "@/components/money-figure-view";
import { OfferCostSimulator } from "@/components/offer-cost-simulator";
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

export function OfferCenterViewPanel({
  center,
  denied,
  gateFromSubmit,
  submitControl,
}: {
  center: OfferCenterView | null;
  denied?: boolean;
  gateFromSubmit?: string | null;
  submitControl?: React.ReactNode;
}) {
  if (denied || center === null) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="offer-denied">
        You cannot open this offer.
      </p>
    );
  }

  const esignOn = getFeatureFlags().FLAG_ESIGN;
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
                <MoneyFigureView figure={comp.soldPrice} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {center.scenarios.map((scenario) => (
          <Card
            key={scenario.strategy}
            data-testid={`scenario-${scenario.strategy}`}
          >
            <CardHeader>
              <CardTitle className="capitalize">{scenario.strategy}</CardTitle>
              <CardDescription>Modeled terms and tradeoffs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MoneyFigureView
                figure={scenario.terms.price}
                testId={`${scenario.strategy}-price`}
              />
              {scenario.terms.earnestMoney ? (
                <MoneyFigureView
                  figure={scenario.terms.earnestMoney}
                  testId={`${scenario.strategy}-earnest`}
                />
              ) : null}
              {scenario.terms.sellerConcessions ? (
                <MoneyFigureView
                  figure={scenario.terms.sellerConcessions}
                  testId={`${scenario.strategy}-concessions`}
                />
              ) : null}
              <MoneyFigureView
                figure={scenario.modeledOutcome.cashToClose}
                testId={`${scenario.strategy}-cash`}
              />
              <MoneyFigureView
                figure={scenario.modeledOutcome.monthlyPayment}
                testId={`${scenario.strategy}-monthly`}
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

      <Card data-testid="offer-gate">
        <CardHeader>
          <CardTitle>Draft and licensee review</CardTitle>
          <CardDescription>
            No offer leaves draft without a licensee review on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p data-testid="offer-status">
            {center.offer
              ? `Status ${center.offer.status}`
              : "No draft yet"}
          </p>
          <p data-testid="licensee-gate" data-gate={gateReason}>
            {gateReason === "LICENSEE_REVIEW_REQUIRED"
              ? "A licensee must review this offer before it can leave draft."
              : gateReason === "already_submitted"
                ? "This offer is already submitted."
                : gateReason === "denied"
                  ? "You cannot submit this offer."
                : "Ready for licensee-approved submit."}
          </p>
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
                className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
              >
                E-signature is off. Offers cannot be submitted until FLAG_ESIGN
                is enabled.
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
