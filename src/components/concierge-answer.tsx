import Link from "next/link";

import { MoneyFigureView } from "@/components/money-figure-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

/**
 * Where "Ask my agent" lands: the licensee thread the contract explainer
 * already routes to. The concierge never answers strategy, price, or legal
 * meaning itself, so a refusal always hands off rather than dead-ending.
 */
export const ASK_MY_AGENT_HREF = "/offers#agent-thread";

const REPLY_BUBBLE =
  "mr-auto max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3 text-sm";

export function isConciergeRefusal(kind: string | null): boolean {
  return kind === "refuse" || kind === "ask_agent";
}

export function ConciergeAnswerView({
  text,
  kind,
}: {
  text: string;
  kind: string | null;
}) {
  if (isConciergeRefusal(kind)) {
    return (
      <div
        data-testid="concierge-answer"
        data-kind={kind ?? undefined}
        className={cn(REPLY_BUBBLE, "space-y-3 bg-sand text-sand-foreground")}
      >
        <p>{text}</p>
        <Link
          href={ASK_MY_AGENT_HREF}
          data-testid="concierge-ask-agent"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10 rounded-full border-sand-foreground/20 bg-card px-4 text-foreground hover:bg-card/80",
          )}
        >
          Ask my agent
        </Link>
      </div>
    );
  }

  const sourced = kind === "answer" ? parseSourcedMoneyLine(text) : null;

  if (sourced === null) {
    return (
      <p
        data-testid="concierge-answer"
        data-kind={kind ?? undefined}
        className={cn(REPLY_BUBBLE, "bg-card ring-1 ring-black/5")}
      >
        {text}
      </p>
    );
  }

  return (
    <div
      data-testid="concierge-answer"
      data-kind={kind ?? undefined}
      className={cn(REPLY_BUBBLE, "space-y-2 bg-card ring-1 ring-black/5")}
    >
      <p>{sourced.lead}</p>
      <MoneyFigureView figure={sourced.figure} size="md" />
      <p className="text-xs text-muted-foreground">Source · {sourced.source}</p>
    </div>
  );
}
