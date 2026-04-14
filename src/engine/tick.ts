import type { GameState } from "./state.ts";
import { regenCompute } from "./resources.ts";

export function step(state: GameState, dtMs: number): void {
  if (dtMs <= 0) return;
  state.now += dtMs;
  regenCompute(state, dtMs);
}
