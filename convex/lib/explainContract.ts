export const ASK_MY_AGENT = "Ask my agent";

export const CONTRACT_SECTION_IDS = [
  "purchase-price",
  "earnest-money",
  "financing",
  "closing-date",
  "inspection",
  "seller-concessions",
] as const;

export type ContractSectionId = (typeof CONTRACT_SECTION_IDS)[number];

export type ContractSection = {
  id: ContractSectionId;
  title: string;
  source: string;
  description: string;
  askAgent: typeof ASK_MY_AGENT;
};

const SECTION_TEMPLATES: Record<
  ContractSectionId,
  Omit<ContractSection, "id" | "askAgent">
> = {
  "purchase-price": {
    title: "Purchase price",
    source: "sample purchase agreement",
    description:
      "This section states the price the buyer offers to pay for the property.",
  },
  "earnest-money": {
    title: "Earnest money",
    source: "sample purchase agreement",
    description:
      "This section states how much money the buyer deposits after acceptance and when that deposit is due.",
  },
  financing: {
    title: "Financing",
    source: "sample purchase agreement",
    description:
      "This section states the loan program the buyer intends to use and that the offer may depend on that loan.",
  },
  "closing-date": {
    title: "Closing date",
    source: "sample purchase agreement",
    description:
      "This section states the target date for closing and transfer of title.",
  },
  inspection: {
    title: "Inspection",
    source: "sample purchase agreement",
    description:
      "This section states whether the buyer may inspect the property and how many days that period lasts.",
  },
  "seller-concessions": {
    title: "Seller concessions",
    source: "sample purchase agreement",
    description:
      "This section states any credit the seller may pay toward the buyer's closing costs.",
  },
};

export function explainSection(id: ContractSectionId): ContractSection {
  const template = SECTION_TEMPLATES[id];
  return {
    id,
    title: template.title,
    source: template.source,
    description: template.description,
    askAgent: ASK_MY_AGENT,
  };
}

export function explainAllSections() {
  return CONTRACT_SECTION_IDS.map((id) => explainSection(id));
}

export function isContractSectionId(value: string): value is ContractSectionId {
  return CONTRACT_SECTION_IDS.some((id) => id === value);
}

export function agentQuestionForSection(section: ContractSection) {
  return `${ASK_MY_AGENT} about section "${section.title}": ${section.description}`;
}
