import { isDemoMode, type AuthEnv } from "@/lib/auth-config";

/** Buyer Search / Tours / Pipeline / Vault stay locked in preview; open in public demo. */
export function buyerFixtureOsUnlocked(env: AuthEnv = process.env): boolean {
  return isDemoMode(env);
}
