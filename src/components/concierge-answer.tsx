import { MoneyFigureView } from "@/components/money-figure-view";
import {
  MONEY_PROVENANCE,
  type MoneyFigure,
  type MoneyProvenance,
} from "../../convex/lib/offerModel";

/**
 * lib/llm renders a sourced money fact as
 * `<lead> <amount>[ ESTIMATE] (<provenance>, <source>)`. The concierge is
 * text-only, so this is the one place that shape is read back so the figure
 * can go through MoneyFigureView instead of sitting inline in prose.
 */
const SOURCED_MONEY_LINE =
  /^(.+?) (-?\$[\d,]+\.\d{2})(?: ESTIMATE)? \(([a-z_]+), ([^()]+)\)$/;

export type SourcedMoneyLine = {
  lead: string;
  figure: MoneyFigure;
  source: string;
};

function isProvenance(value: string): value is MoneyProvenance {
  return MONEY_PROVENANCE.some((known) => known === value);
}

export function parseSourcedMoneyLine(text: string): SourcedMoneyLine | null {
  const match = SOURCED_MONEY_LINE.exec(text.trim());
  if (match === null) {
    return null;
  }
  const [, lead, amount, provenance, source] = match;
  if (
    lead === undefined ||
    amount === undefined ||
    provenance === undefined ||
    source === undefined ||
    !isProvenance(provenance)
  ) {
    return null;
  }
  const dollars = Number(amount.replace(/[$,]/g, ""));
  if (!Number.isFinite(dollars)) {
    return null;
  }
  return {
    lead,
    source,
    figure: {
      amountCents: Math.round(dollars * 100),
      currency: "USD",
      provenance,
      asOf: 0,
    },
  };
}

export function ConciergeAnswerView({
  text,
  kind,
}: {
  text: string;
  kind: string | null;
}) {
  const sourced = kind === "answer" ? parseSourcedMoneyLine(text) : null;

  if (sourced === null) {
    return (
      <p data-testid="concierge-answer" data-kind={kind ?? undefined}>
        {text}
      </p>
    );
  }

  return (
    <div
      data-testid="concierge-answer"
      data-kind={kind ?? undefined}
      className="space-y-2"
    >
      <p>{sourced.lead}</p>
      <MoneyFigureView figure={sourced.figure} size="md" />
      <p className="text-xs text-muted-foreground">Source · {sourced.source}</p>
    </div>
  );
}
