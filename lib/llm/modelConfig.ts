export type EnvMap = Record<string, string | undefined>;

/**
 * Env vars accepted for concierge / lib/llm provider calls. First match wins for
 * diagnostics; presence of any non-empty value enables the live coach path.
 */
export const CONCIERGE_MODEL_KEY_ENVS = [
  "REALTYRISE_MODEL_API_KEY",
  "OPENAI_API_KEY",
  "AI_GATEWAY_API_KEY",
] as const;

export const CONCIERGE_MODEL_KEY_ENV = CONCIERGE_MODEL_KEY_ENVS[0];

export function conciergeModelKeyPresent(env: EnvMap = process.env): boolean {
  return CONCIERGE_MODEL_KEY_ENVS.some((name) => {
    const value = env[name];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function conciergeModelKeyLabel(env: EnvMap = process.env): string {
  for (const name of CONCIERGE_MODEL_KEY_ENVS) {
    const value = env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return name;
    }
  }
  return CONCIERGE_MODEL_KEY_ENV;
}
