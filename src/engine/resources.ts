import { COMPUTE } from "../data/tuning.ts";
import type { GameState } from "./state.ts";
import { computeRegenPerSecond } from "./upgrades.ts";

export function regenCompute(state: GameState, dtMs: number): void {
  if (state.compute >= COMPUTE.max) {
    state.compute = COMPUTE.max;
    return;
  }
  state.compute = Math.min(
    COMPUTE.max,
    state.compute + computeRegenPerSecond(state) * (dtMs / 1000),
  );
}

export function spendCompute(state: GameState, amount: number): boolean {
  if (state.compute < amount) return false;
  state.compute -= amount;
  return true;
}

export function awardDp(state: GameState, amount: number): void {
  if (amount <= 0) return;
  state.dp += amount;
  state.totalDpEarned += amount;
}
