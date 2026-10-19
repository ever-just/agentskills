/**
 * One-file Jev wrapper. Copy into the product repo. Questions and thresholds
 * live in a sibling constants file (or JSON) so humans can review them.
 *
 *   npm install @typesafe-ai/sdk
 *   export TYPESAFE_API_KEY=...
 *   export JEV_ENABLED=1
 *
 * Returns { answers, model, usage, fallback: null } on success;
 * { answers: {}, model: null, usage: null, fallback: "inert"|"timeout"|errName }
 * otherwise. Callers own fail-open vs fail-closed and can stamp model/fallback
 * into telemetry (04). The client is created lazily so importing this module
 * is always inert.
 */
import { TypeSafeClient } from "@typesafe-ai/sdk";

const FLAG = process.env.JEV_ENABLED === "1";
let client: TypeSafeClient | null = null;

function getClient(): TypeSafeClient {
  client ??= new TypeSafeClient();
  return client;
}

export interface JevResult {
  answers: Record<string, unknown>;
  model: string | null;
  usage: unknown;
  fallback: string | null;
}

export async function jev(
  state: unknown,
  questions: Record<string, unknown>,
  timeoutMs = 0,
): Promise<JevResult> {
  const empty = { answers: {}, model: null, usage: null };
  if (!FLAG || !process.env.TYPESAFE_API_KEY) return { ...empty, fallback: "inert" };
  try {
    const call = getClient().systemOne({ state, questions }) as Promise<{
      answers?: Record<string, unknown>;
      model?: string;
      usage?: unknown;
    }>;
    const resp = timeoutMs
      ? await Promise.race([
          call,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("jev_timeout")), timeoutMs),
          ),
        ])
      : await call;
    return {
      answers: resp.answers ?? {},
      model: resp.model ?? null,
      usage: resp.usage ?? null,
      fallback: null,
    };
  } catch (e) {
    return {
      ...empty,
      fallback: e instanceof Error && e.message === "jev_timeout" ? "timeout" : (e as Error).name,
    };
  }
}
