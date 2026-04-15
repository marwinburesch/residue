import type { GameState } from "./state.ts";
import { computeMax, computeRegenPerSecond } from "./upgrades.ts";

export function regenCompute(state: GameState, dtMs: number): void {
	const max = computeMax(state);
	if (state.compute >= max) {
		state.compute = max;
		return;
	}
	state.compute = Math.min(
		max,
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
