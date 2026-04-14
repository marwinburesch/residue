import type { GameState } from "./state.ts";
import { regenCompute } from "./resources.ts";
import { drainExtracted, tickChannels, tickReveal } from "./fragments.ts";
import { ingestBatch, tickProfileDp } from "./profiles.ts";
import { tickSuspicion } from "./suspicion.ts";

export function step(state: GameState, dtMs: number): void {
  if (dtMs <= 0) return;
  state.now += dtMs;
  regenCompute(state, dtMs);
  tickChannels(state, dtMs);
  tickReveal(state, dtMs);
  for (const batch of drainExtracted(state)) ingestBatch(state, batch);
  tickProfileDp(state, dtMs);
  tickSuspicion(state, dtMs);
}
