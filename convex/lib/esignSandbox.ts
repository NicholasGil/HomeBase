/**
 * Sandbox e-sign adapter. App owns workflow; provider owns cryptography.
 * This file never calls Dropbox Sign or DocuSign and never reads an API key.
 */

export const LIVE_ESIGN_PROVIDERS = [
  "dropbox_sign",
  "hellosign",
  "docusign",
] as const;

export function isLiveEsignProvider(provider: string) {
  return (LIVE_ESIGN_PROVIDERS as readonly string[]).includes(provider);
}

export function assertSandboxEsignProvider(provider: string) {
  if (provider !== "sandbox" || isLiveEsignProvider(provider)) {
    throw new Error("ESIGN_NOT_ENABLED");
  }
}

export function sandboxSendPacket(packetId: string) {
  return { providerRef: `sandbox:packet:${packetId}` };
}

export function sandboxCompleteSign(providerRef: string) {
  if (!providerRef.startsWith("sandbox:packet:")) {
    throw new Error("ESIGN_NOT_ENABLED");
  }
  return { signed: true as const, providerRef };
}

export function esignKeysNoteForNeedsHuman() {
  return {
    issue: 1,
    blocked: "DROPBOX_SIGN_OR_DOCUSIGN_API_KEY",
    detail:
      "M11 uses the sandbox adapter locally and in CI. Production provider keys stay on needs-human #1. Do not stub the key.",
  };
}
