import type { MutationCtx } from "../_generated/server";
import { DEFAULT_FEATURE_FLAGS } from "./validators";

/** Self-serve Path B buyers land in this org until brokerage onboarding exists. */
export const PATH_B_PREVIEW_ORG_NAME = "RealtyRise Path B Preview";

export async function findOrCreatePathBPreviewOrg(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("orgs")
    .withIndex("by_name", (q) => q.eq("name", PATH_B_PREVIEW_ORG_NAME))
    .unique();
  if (existing !== null) {
    return existing._id;
  }
  return await ctx.db.insert("orgs", {
    name: PATH_B_PREVIEW_ORG_NAME,
    state: "US",
    settings: {},
    flags: { ...DEFAULT_FEATURE_FLAGS },
  });
}
