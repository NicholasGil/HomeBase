import { ASK_MY_AGENT, type ContractSection } from "./explainContract";

export const UPL_RULES = [
  "describes_only",
  "templated_output",
  "no_drafting",
  "no_enforceability_opinions",
  "ask_my_agent",
] as const;

export type UplRule = (typeof UPL_RULES)[number];

const DRAFTING =
  /\b(add this clause|replace with|draft|suggested language|insert the following)\b/i;
const ENFORCEABILITY =
  /\b(enforceable|unenforceable|legally binding|valid under .* law|a court would|legal advice)\b/i;
const ADVICE =
  /\b(you should|you must|we recommend|i advise|waive this|do not sign)\b/i;

export function checkUplChecklist(section: ContractSection): {
  ok: boolean;
  failed: UplRule[];
} {
  const failed: UplRule[] = [];
  if (!section.description.startsWith("This section states")) {
    failed.push("describes_only");
  }
  if (ADVICE.test(section.description)) {
    failed.push("describes_only");
  }
  if (section.source.length === 0 || section.description.length === 0) {
    failed.push("templated_output");
  }
  if (DRAFTING.test(section.description)) {
    failed.push("no_drafting");
  }
  if (ENFORCEABILITY.test(section.description)) {
    failed.push("no_enforceability_opinions");
  }
  if (section.askAgent !== ASK_MY_AGENT) {
    failed.push("ask_my_agent");
  }
  return { ok: failed.length === 0, failed };
}
