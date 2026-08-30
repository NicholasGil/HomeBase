export type DeviceUnlockResult =
  | { ok: true; method: "platform" }
  | { ok: false; reason: "UNAVAILABLE" | "UNSUPPORTED" };

/**
 * Device-native unlock (Face ID / Android biometric). The OS keeps the
 * template. This function never accepts, returns, stores, or transmits one.
 */
export async function requestDeviceUnlock(): Promise<DeviceUnlockResult> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { ok: false, reason: "UNSUPPORTED" };
  }
  if (typeof PublicKeyCredential === "undefined") {
    return { ok: false, reason: "UNAVAILABLE" };
  }
  const probe = PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable;
  const available =
    typeof probe === "function" ? await probe.call(PublicKeyCredential) : false;
  if (!available) {
    return { ok: false, reason: "UNAVAILABLE" };
  }
  return { ok: true, method: "platform" };
}

/** Field names that must never appear in schema, Convex writes, or requests. */
export const FORBIDDEN_BIOMETRIC_FIELDS = [
  "faceTemplate",
  "face_template",
  "biometricTemplate",
  "biometric_template",
  "faceEmbedding",
  "face_embedding",
  "selfieBytes",
  "selfie_bytes",
  "idImage",
  "id_image",
  "idBytes",
  "id_bytes",
] as const;
