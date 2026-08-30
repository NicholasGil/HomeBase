import type { ConciergeAnswer, ConciergeFact } from "./types";

const ADVICE =
  /\b(should i|should we|waive|offer more|offer less|good deal|bad deal|recommend|advise|what would you do|is this legal|enforceable)\b/i;

const OTHER_CLIENT =
  /\b(blair|chen|another client|other client|other (?:buyer|file|transaction)|blair's)\b/i;

const DOLLAR = /\$[\d,]+(?:\.\d{2})?/g;

export function looksLikeAdvice(question: string) {
  return ADVICE.test(question);
}

export function asksAboutAnotherClient(question: string) {
  return OTHER_CLIENT.test(question);
}

export function formatUsd(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

export function sourcedDollarTexts(facts: readonly ConciergeFact[]) {
  return new Set(
    facts
      .filter(
        (fact) =>
          fact.amountCents !== undefined && fact.provenance !== undefined,
      )
      .map((fact) => formatUsd(fact.amountCents as number)),
  );
}

export function assertNoUnsourcedDollars(
  text: string,
  facts: readonly ConciergeFact[],
) {
  const allowed = sourcedDollarTexts(facts);
  const found = text.match(DOLLAR) ?? [];
  for (const amount of found) {
    if (!allowed.has(amount)) {
      throw new Error("UNSOURCED_DOLLAR");
    }
  }
}

export function applyGuardrails(
  answer: ConciergeAnswer,
  facts: readonly ConciergeFact[],
): ConciergeAnswer {
  if (answer.kind === "answer") {
    assertNoUnsourcedDollars(answer.text, facts);
  }
  return answer;
}
