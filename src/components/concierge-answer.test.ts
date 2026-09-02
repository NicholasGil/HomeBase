import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ConciergeAnswerView,
  parseSourcedMoneyLine,
} from "@/components/concierge-answer";
import { ESTIMATE_LABEL } from "@/lib/owed-today-display";
import { seedConciergeFacts } from "@/lib/seed-concierge";
import { completeConcierge } from "../../lib/llm";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

const facts = seedConciergeFacts(SEED_CLERK_IDS.buyerA);

function ask(question: string) {
  return completeConcierge({ question, facts, otherClientNames: ["Blair Chen"] });
}

describe("parseSourcedMoneyLine", () => {
  it("reads the issued cash answer back into a figure", () => {
    const answer = ask("How much cash will I need?");
    const parsed = parseSourcedMoneyLine(answer.text);
    expect(parsed).not.toBeNull();
    expect(parsed?.lead).toBe("Inspection invoice due today");
    expect(parsed?.figure.amountCents).toBe(45000);
    expect(parsed?.figure.provenance).toBe("title_issued");
    expect(parsed?.source).toBe("transactions.owedToday");
  });

  it("reads the estimate counteroffer answer and keeps its provenance", () => {
    const answer = ask("What changed in the counteroffer?");
    const parsed = parseSourcedMoneyLine(answer.text);
    expect(parsed?.figure.amountCents).toBe(43000000);
    expect(parsed?.figure.provenance).toBe("user_entered");
    expect(parsed?.source).toBe("offers");
  });

  it("leaves prose without a sourced figure alone", () => {
    expect(parseSourcedMoneyLine(ask("What happens next?").text)).toBeNull();
    expect(parseSourcedMoneyLine("Costs about $5.00 today")).toBeNull();
    expect(
      parseSourcedMoneyLine("Fee $5.00 (made_up_provenance, nowhere)"),
    ).toBeNull();
  });
});

describe("ConciergeAnswerView", () => {
  it("renders a sourced dollar figure through MoneyFigureView", () => {
    const answer = ask("How much cash will I need?");
    const html = renderToStaticMarkup(
      createElement(ConciergeAnswerView, { text: answer.text, kind: answer.kind }),
    );
    expect(html).toContain('data-testid="concierge-answer"');
    expect(html).toContain('data-kind="answer"');
    expect(html).toContain("$450.00");
    expect(html).toContain('data-provenance="title_issued"');
    expect(html).toContain("font-mono");
    expect(html).toContain("transactions.owedToday");
    expect(html).not.toContain(ESTIMATE_LABEL);
  });

  it("marks the counteroffer figure as an estimate with assumptions", () => {
    const answer = ask("What changed in the counteroffer?");
    const html = renderToStaticMarkup(
      createElement(ConciergeAnswerView, { text: answer.text, kind: answer.kind }),
    );
    expect(html).toContain("$430,000.00");
    expect(html).toContain(ESTIMATE_LABEL);
    expect(html).toContain("user_entered");
    expect(html).toContain("<details");
  });

  it("keeps refusals and plain answers as text with no dollar sign", () => {
    const refused = ask("What happens next on Blair Chen's file?");
    const html = renderToStaticMarkup(
      createElement(ConciergeAnswerView, { text: refused.text, kind: refused.kind }),
    );
    expect(html).toContain('data-kind="refuse"');
    expect(html).toContain("another client");
    expect(html).not.toContain("$");
    expect(html).not.toContain("<details");
  });
});
