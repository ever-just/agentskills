/**
 * One-file Jev wrapper. Copy into the product repo. Questions and thresholds
 * live in a sibling constants file (or JSON) so humans can review them.
 *
 *   npm install @typesafe-ai/sdk
 *   export TYPESAFE_API_KEY=...
 */
import { TypeSafeClient } from "@typesafe-ai/sdk";

const FLAG = process.env.JEV_ENABLED === "1";
const client = new TypeSafeClient();

export async function jev(
  state: unknown,
  questions: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!FLAG || !process.env.TYPESAFE_API_KEY) return {};
  try {
    const resp = await client.systemOne({ state, questions });
    return (resp as { answers?: Record<string, unknown> }).answers ?? {};
  } catch {
    return {};
  }
}
