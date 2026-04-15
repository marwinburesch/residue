import type { GameState } from "./state.ts";
import { computeMax, computeRegenPerSecond } from "./upgrades.ts";
import { suspicionThrottle } from "./suspicion.ts";

export function regenCompute(state: GameState, dtMs: number): void {
	const max = computeMax(state);
	if (state.compute >= max) {
		state.compute = max;
		return;
	}
	const rate = computeRegenPerSecond(state) * suspicionThrottle(state);
	state.compute = Math.min(max, state.compute + rate * (dtMs / 1000));
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
