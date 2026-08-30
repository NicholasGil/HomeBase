import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export type ConciergeFact = {
  key: string;
  text: string;
  source: string;
  amountCents?: number;
  provenance?: "ai_estimate" | "lender_issued" | "title_issued" | "user_entered";
};

export async function gatherConciergeFacts(
  ctx: QueryCtx,
  transaction: Doc<"transactions">,
): Promise<ConciergeFact[]> {
  const [tasks, documents, appointments, offers, assignments, stages] =
    await Promise.all([
      ctx.db
        .query("tasks")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", transaction._id),
        )
        .collect(),
      ctx.db
        .query("documents")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", transaction._id),
        )
        .collect(),
      ctx.db
        .query("appointments")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", transaction._id),
        )
        .collect(),
      ctx.db
        .query("offers")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", transaction._id),
        )
        .collect(),
      ctx.db
        .query("vendorAssignments")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", transaction._id),
        )
        .collect(),
      ctx.db
        .query("journeyStages")
        .withIndex("by_org_key", (q) =>
          q.eq("orgId", transaction.orgId).eq("key", transaction.stage),
        )
        .unique(),
    ]);

  const facts: ConciergeFact[] = [];
  const nextTask = tasks.find((task) => task.status === "open");
  if (nextTask !== undefined) {
    facts.push({
      key: "next",
      text: `Next is ${nextTask.title}, assigned to ${nextTask.assigneeRole}.`,
      source: "tasks",
    });
  }

  const inspection = appointments.find((row) => row.type === "inspection");
  if (inspection !== undefined) {
    facts.push({
      key: "inspection_when",
      text: `Inspection is at ${new Date(inspection.startsAt).toISOString()}.`,
      source: "appointments",
    });
  } else if (transaction.keyDates.inspectionDueAt !== undefined) {
    facts.push({
      key: "inspection_when",
      text: `Inspection is due ${new Date(transaction.keyDates.inspectionDueAt).toISOString()}.`,
      source: "transactions.keyDates",
    });
  }

  const required = stages?.requiredDocuments ?? [];
  const present = new Set(documents.map((document) => document.type));
  const missing = required.filter((type) => !present.has(type));
  if (missing.length > 0) {
    facts.push({
      key: "missing",
      text: `Missing for ${stages?.label ?? transaction.stage}: ${missing.join(", ")}.`,
      source: "journeyStages.requiredDocuments",
    });
  }

  if (transaction.owedToday !== undefined) {
    facts.push({
      key: "cash",
      text:
        transaction.owedToday.label ??
        "Sourced amount owed today on this file.",
      source: "transactions.owedToday",
      amountCents: transaction.owedToday.amountCents,
      provenance: transaction.owedToday.provenance,
    });
  }

  const inspectionDoc = documents.find(
    (document) => document.type === "inspection_report",
  );
  if (inspectionDoc?.extractedSummary !== undefined) {
    facts.push({
      key: "inspection_findings",
      text: inspectionDoc.extractedSummary,
      source: "documents.inspection_report",
    });
  }

  const offer = offers[0];
  if (offer !== undefined) {
    facts.push({
      key: "counteroffer",
      text: offer.terms.price.label ?? "Current offer price on this file.",
      source: "offers",
      amountCents: offer.terms.price.amountCents,
      provenance: offer.terms.price.provenance,
    });
  }

  for (const assignment of assignments) {
    const vendor = await ctx.db.get(assignment.vendorId);
    if (vendor !== null && vendor.category === "lender") {
      facts.push({
        key: "lender",
        text: `${vendor.name} is the lender on this file.`,
        source: "vendors",
      });
    }
  }

  const showing = appointments
    .filter((row) => row.type === "showing")
    .sort((left, right) => left.startsAt - right.startsAt)[0];
  if (showing !== undefined) {
    facts.push({
      key: "first_showing",
      text: `Leave for the first showing at ${new Date(showing.startsAt).toISOString()}.`,
      source: "appointments",
    });
  }

  return facts;
}
