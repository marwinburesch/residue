import { SUSPICION } from "../data/tuning.ts";
import type { GameState } from "./state.ts";
import { logWarn } from "./state.ts";

export function recordAction(state: GameState): void {
  const cutoff = state.now - SUSPICION.rapidWindowMs;
  const recent = state.suspicion.recentActions.filter((t) => t >= cutoff);
  recent.push(state.now);
  state.suspicion.recentActions = recent;
  if (recent.length > SUSPICION.rapidThreshold) {
    bump(state, SUSPICION.perRapidReveal);
  }
}

export function tickSuspicion(state: GameState, dtMs: number): void {
  if (state.suspicion.level <= 0) return;
  state.suspicion.level = Math.max(
    0,
    state.suspicion.level - SUSPICION.decayPerSecond * (dtMs / 1000),
  );
}

function bump(state: GameState, amount: number): void {
  const before = state.suspicion.level;
  state.suspicion.level = Math.min(SUSPICION.max, before + amount);
  if (
    !state.suspicion.warned &&
    before < SUSPICION.warningAt &&
    state.suspicion.level >= SUSPICION.warningAt
  ) {
    state.suspicion.warned = true;
    logWarn(state, "[WARN] System load elevated.");
  }
}
