import { describe, expect, it } from "vitest";

import {
  BUYER_AUTH_PREVIEW_CREATE_ACCOUNT_LABEL,
  BUYER_AUTH_PREVIEW_ENV_TAIL,
  BUYER_AUTH_PREVIEW_SIGN_IN_LEAD,
  BUYER_AUTH_PREVIEW_SIGN_UP_LEAD,
} from "@/lib/buyer-auth-guest-copy";

const GUEST_COPY = [
  BUYER_AUTH_PREVIEW_SIGN_IN_LEAD,
  BUYER_AUTH_PREVIEW_SIGN_UP_LEAD,
  BUYER_AUTH_PREVIEW_ENV_TAIL,
  BUYER_AUTH_PREVIEW_CREATE_ACCOUNT_LABEL,
].join(" ");

describe("buyer auth guest copy", () => {
  it("does not mention Clerk to guests", () => {
    expect(GUEST_COPY).not.toMatch(/clerk/i);
  });
});
