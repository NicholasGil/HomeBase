import type { MutationCtx } from "../_generated/server";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomInviteCode(length = 8) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
}

export async function allocateUniqueInviteCode(ctx: MutationCtx) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const inviteCode = randomInviteCode();
    const existing = await ctx.db
      .query("orgs")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
      .unique();
    if (existing === null) {
      return inviteCode;
    }
  }
  throw new Error("INVITE_CODE_EXHAUSTED");
}
