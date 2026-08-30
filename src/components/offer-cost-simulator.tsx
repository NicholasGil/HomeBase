"use client";

import { useMemo, useState } from "react";

import { MoneyFigureView } from "@/components/money-figure-view";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ESTIMATE_LABEL } from "@/lib/owed-today-display";
import { SEED_OFFER_AS_OF } from "../../convex/seedPlan";
import {
  SIMULATOR_DERIVED_KEYS,
  simulateOfferCost,
  type FinancingProgram,
} from "../../convex/lib/offerModel";

const PROGRAMS = ["conventional", "fha", "va", "cash"] as const;

function isFinancingProgram(value: string): value is FinancingProgram {
  return PROGRAMS.some((program) => program === value);
}

const DERIVED_TEST_IDS = {
  estimatedLoan: "sim-estimatedLoan",
  closingCosts: "sim-closingCosts",
  cashToClose: "sim-cashToClose",
  monthlyPayment: "sim-monthlyPayment",
  monthlyTaxesInsurance: "sim-monthlyTaxesInsurance",
  totalMonthly: "sim-totalMonthly",
} as const;

export function OfferCostSimulator({
  listPriceCents,
}: {
  listPriceCents: number;
}) {
  const [purchasePriceCents, setPurchasePriceCents] = useState(listPriceCents);
  const [downPaymentCents, setDownPaymentCents] = useState(
    Math.round(listPriceCents * 0.2),
  );
  const [sellerConcessionsCents, setSellerConcessionsCents] = useState(500000);
  const [rateBps, setRateBps] = useState(675);
  const [program, setProgram] = useState<FinancingProgram>("conventional");

  const simulation = useMemo(
    () =>
      simulateOfferCost({
        purchasePriceCents,
        downPaymentCents,
        sellerConcessionsCents,
        rateBps,
        program,
        asOf: SEED_OFFER_AS_OF,
      }),
    [
      purchasePriceCents,
      downPaymentCents,
      sellerConcessionsCents,
      rateBps,
      program,
    ],
  );

  return (
    <section className="space-y-4" data-testid="offer-simulator">
      <Card data-testid="assumptions-panel">
        <CardHeader>
          <CardTitle>Offer cost simulator</CardTitle>
          <CardDescription>
            Assumptions stay on this panel. Every output is an {ESTIMATE_LABEL}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            Purchase price
            <input
              type="number"
              data-testid="sim-price"
              className="w-full rounded-md border bg-background px-3 py-2"
              value={purchasePriceCents / 100}
              onChange={(event) =>
                setPurchasePriceCents(
                  Math.round(Number(event.target.value) * 100),
                )
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            Down payment
            <input
              type="number"
              data-testid="sim-down"
              className="w-full rounded-md border bg-background px-3 py-2"
              value={downPaymentCents / 100}
              onChange={(event) =>
                setDownPaymentCents(Math.round(Number(event.target.value) * 100))
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            Seller concessions
            <input
              type="number"
              data-testid="sim-concessions"
              className="w-full rounded-md border bg-background px-3 py-2"
              value={sellerConcessionsCents / 100}
              onChange={(event) =>
                setSellerConcessionsCents(
                  Math.round(Number(event.target.value) * 100),
                )
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            Rate assumption (%)
            <input
              type="number"
              step="0.01"
              data-testid="sim-rate"
              className="w-full rounded-md border bg-background px-3 py-2"
              value={rateBps / 100}
              onChange={(event) =>
                setRateBps(Math.round(Number(event.target.value) * 100))
              }
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            Loan program
            <select
              data-testid="sim-program"
              className="w-full rounded-md border bg-background px-3 py-2"
              value={program}
              onChange={(event) => {
                const next = event.target.value;
                if (isFinancingProgram(next)) {
                  setProgram(next);
                }
              }}
            >
              {PROGRAMS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {simulation.assumptions.program}
            </Badge>
            <Badge variant="outline">{rateBps} bps</Badge>
            <span data-testid="simulator-assumptions">
              Price, down payment, concessions, rate, and program stay visible.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {SIMULATOR_DERIVED_KEYS.map((key) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-base">
                {simulation.derived[key].label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoneyFigureView
                figure={simulation.derived[key]}
                testId={DERIVED_TEST_IDS[key]}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
