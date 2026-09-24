import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { assertRole, requireMembership } from "./lib/authz";
import {
  buildCommandCenter,
  FINANCING_DOCUMENT_TYPES,
  type CommandCenterClientInput,
  type CommandCenterView,
} from "./lib/commandCenter";

export type CommandCenterBookScope = "assigned" | "org";

export type CommandCenterBook = {
  view: CommandCenterView;
  scope: CommandCenterBookScope;
  assignedCount: number;
  orgCount: number;
};

async function loadBookTransactions(
  ctx: QueryCtx,
  user: Doc<"users">,
  membership: Doc<"memberships">,
) {
  const assigned = await ctx.db
    .query("transactions")
    .withIndex("by_agent", (q) => q.eq("agentId", user._id))
    .collect();

  if (membership.role === "broker" || membership.role === "admin") {
    const orgTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();
    return {
      transactions: orgTransactions,
      scope: "org" as const,
      assignedCount: assigned.length,
      orgCount: orgTransactions.length,
    };
  }

  if (assigned.length > 0) {
    const orgTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();
    return {
      transactions: assigned,
      scope: "assigned" as const,
      assignedCount: assigned.length,
      orgCount: orgTransactions.length,
    };
  }

  const orgTransactions = await ctx.db
    .query("transactions")
    .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
    .collect();
  return {
    transactions: orgTransactions,
    scope: orgTransactions.length > 0 ? ("org" as const) : ("assigned" as const),
    assignedCount: 0,
    orgCount: orgTransactions.length,
  };
}

async function buildBook(
  ctx: QueryCtx,
  user: Doc<"users">,
  membership: Doc<"memberships">,
): Promise<CommandCenterBook> {
  const { transactions, scope, assignedCount, orgCount } =
    await loadBookTransactions(ctx, user, membership);
  const stages = await ctx.db
    .query("journeyStages")
    .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
    .collect();
  const financingStage = stages.find((stage) => stage.key === "financing");
  const financingRequired =
    financingStage?.requiredDocuments ?? FINANCING_DOCUMENT_TYPES;

  const inputs: CommandCenterClientInput[] = [];
  for (const transaction of transactions) {
    inputs.push(
      await toClientInput(ctx, {
        transaction,
        stages,
        financingRequired,
      }),
    );
  }
  return {
    view: buildCommandCenter(inputs, Date.now()),
    scope,
    assignedCount,
    orgCount,
  };
}

export const getBook = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireMembership(ctx);
    assertRole(membership, ["agent", "broker", "admin"]);
    return await buildBook(ctx, user, membership);
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireMembership(ctx);
    assertRole(membership, ["agent"]);
    const book = await buildBook(ctx, user, membership);
    return book.view;
  },
});

async function toClientInput(
  ctx: QueryCtx,
  input: {
    transaction: Doc<"transactions">;
    stages: Doc<"journeyStages">[];
    financingRequired: readonly string[];
  },
): Promise<CommandCenterClientInput> {
  const [client, documents, tasks, offers, property] = await Promise.all([
    ctx.db.get(input.transaction.clientId),
    ctx.db
      .query("documents")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", input.transaction._id),
      )
      .collect(),
    ctx.db
      .query("tasks")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", input.transaction._id),
      )
      .collect(),
    ctx.db
      .query("offers")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", input.transaction._id),
      )
      .collect(),
    input.transaction.propertyId === undefined
      ? Promise.resolve(null)
      : ctx.db.get(input.transaction.propertyId),
  ]);
  const buyer = client === null ? null : await ctx.db.get(client.userId);
  const currentStage = input.stages.find(
    (stage) => stage.key === input.transaction.stage,
  );
  const nextTask = tasks.find((task) => task.status === "open") ?? null;
  const offer = offers[0];

  return {
    clientId: input.transaction.clientId,
    transactionId: input.transaction._id,
    name: buyer?.name ?? "Unknown client",
    stage: input.transaction.stage,
    stageLabel: currentStage?.label ?? input.transaction.stage,
    stageOrder: currentStage?.order ?? 0,
    status: input.transaction.status,
    documentTypes: documents.map((document) => document.type),
    financingRequired: input.financingRequired,
    inspectionDueAt: input.transaction.keyDates.inspectionDueAt,
    closingAt: input.transaction.keyDates.closingAt,
    offerStatus: offer?.status,
    nextTask:
      nextTask === null
        ? null
        : { title: nextTask.title, assigneeRole: nextTask.assigneeRole },
    propertyCity: property?.address.city ?? null,
    propertyState: property?.address.state ?? null,
  };
}
