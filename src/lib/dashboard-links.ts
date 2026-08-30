export function nextActionHref(input: {
  title: string;
  transactionId: string;
}): string {
  const title = input.title.toLowerCase();
  if (
    title.includes("tour") ||
    title.includes("schedule") ||
    title.includes("showing")
  ) {
    return "/tours";
  }
  if (
    title.includes("document") ||
    title.includes("sign") ||
    title.includes("review") ||
    title.includes("invoice") ||
    title.includes("lender")
  ) {
    return "/vault";
  }
  if (title.includes("offer")) {
    return "/offers";
  }
  return `/transactions/${input.transactionId}`;
}

export function owedTodayHref() {
  return "/vault";
}
