const DOC_PHRASES: Record<string, string> = {
  repair_request: "a repair request",
  inspection_report: "an inspection report",
  preapproval: "a pre-approval letter",
  purchase_agreement: "a purchase agreement",
  earnest_money: "earnest money proof",
};

function humanizeToken(token: string): string {
  const key = token.replace(/\.$/, "").trim();
  if (DOC_PHRASES[key]) {
    return DOC_PHRASES[key];
  }
  const words = key.replace(/_/g, " ");
  return `a ${words}`;
}

/** Turn seed missing-doc fragments into buyer-facing phrases (no raw ids). */
export function humanizeDemoMissingFragment(raw: string): string {
  const cleaned = raw.replace(/\.$/, "").trim();
  if (cleaned.length === 0) {
    return cleaned;
  }
  const parts = cleaned.split(/,\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return cleaned;
  }
  if (parts.length === 1) {
    return humanizeToken(parts[0]!);
  }
  const phrases = parts.map((part) => humanizeToken(part));
  if (phrases.length === 2) {
    return `${phrases[0]} and ${phrases[1]}`;
  }
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
}
