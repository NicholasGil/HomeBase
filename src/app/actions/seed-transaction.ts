"use server";

import { getTestSession } from "@/app/actions/test-session";
import { loadSeedTransactionForViewer } from "@/lib/test-session";

export async function loadSeedTransaction(input: { transactionId: string }) {
  const session = await getTestSession();
  return loadSeedTransactionForViewer(session, input.transactionId);
}
