import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * auditLog is append-only. This file is the only writer.
 * Do not add patch, replace, or delete helpers here.
 */
export async function appendAuditLog(
  ctx: MutationCtx,
  entry: {
    actorId: Id<"users"> | "system";
    action: string;
    targetType: string;
    targetId: string;
    meta?: Record<string, string>;
  },
) {
  return await ctx.db.insert("auditLog", {
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    at: Date.now(),
    meta: entry.meta ?? {},
  });
}
