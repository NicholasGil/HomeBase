export const DOCUMENT_TYPES = [
  "preapproval",
  "inspection_report",
  "purchase_agreement",
  "earnest_money",
  "appraisal",
  "title",
  "insurance",
  "invoice",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

const FILE_HINTS: { match: RegExp; type: DocumentType }[] = [
  { match: /pre-?approv|prequal/i, type: "preapproval" },
  { match: /invoice|bill/i, type: "invoice" },
  { match: /inspect/i, type: "inspection_report" },
  { match: /purchase|psa|contract/i, type: "purchase_agreement" },
  { match: /earnest|emd/i, type: "earnest_money" },
  { match: /apprais/i, type: "appraisal" },
  { match: /title/i, type: "title" },
  { match: /insur/i, type: "insurance" },
];

export function classifyDocumentType(input: {
  type?: string;
  fileName?: string;
}): DocumentType {
  if (input.type !== undefined) {
    const typed = DOCUMENT_TYPES.find((value) => value === input.type);
    if (typed !== undefined) {
      return typed;
    }
  }
  const fileName = input.fileName ?? "";
  for (const hint of FILE_HINTS) {
    if (hint.match.test(fileName)) {
      return hint.type;
    }
  }
  return "other";
}
