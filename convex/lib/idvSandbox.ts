/**
 * Sandbox IDV adapter. Vendor would compare government ID to a live selfie.
 * This file never calls Persona or Stripe Identity and never stores those bytes.
 */

export const LIVE_IDV_PROVIDERS = ["persona", "stripe_identity"] as const;

export function isLiveIdvProvider(provider: string) {
  return (LIVE_IDV_PROVIDERS as readonly string[]).includes(provider);
}

export function assertSandboxIdvProvider(provider: string) {
  if (provider !== "sandbox" || isLiveIdvProvider(provider)) {
    throw new Error("IDV_NOT_ENABLED");
  }
}

export function sandboxStartIdv(sessionKey: string) {
  return { providerRef: `sandbox:idv:${sessionKey}` };
}

export function sandboxCompleteIdv(providerRef: string) {
  if (!providerRef.startsWith("sandbox:idv:")) {
    throw new Error("IDV_NOT_ENABLED");
  }
  return { verified: true as const, providerRef };
}

export function idvKeysNoteForNeedsHuman() {
  return {
    issue: 1,
    blocked: "PERSONA_OR_STRIPE_IDENTITY_KEY",
    detail:
      "M12 tier 2 uses the sandbox adapter locally and in CI. Production IDV keys stay on needs-human #1. Do not stub the key. Per-state review stays on that issue.",
  };
}
