import type { GameState } from "./state.ts";
import { regenCompute } from "./resources.ts";
import { collectExtracted, tickChannels, tickReveal } from "./fragments.ts";

export function step(state: GameState, dtMs: number): void {
  if (dtMs <= 0) return;
  state.now += dtMs;
  regenCompute(state, dtMs);
  tickChannels(state, dtMs);
  tickReveal(state, dtMs);
  collectExtracted(state);
}
