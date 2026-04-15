import { STAGES, type StageId } from "../data/stageConfig.ts";
import type { GameState } from "./state.ts";
import { fireMilestone } from "./milestones.ts";
import { upgradeLevel } from "./upgrades.ts";

export function dpSpent(state: GameState): number {
  return state.totalDpEarned - state.dp;
}

export function outlineProfileCount(state: GameState): number {
  let n = 0;
  for (const p of state.profiles) if (p.tier === "outline") n++;
  return n;
}

export function canAdvance(state: GameState): StageId | null {
  const next = STAGES.find((s) => s.id === state.stage + 1);
  if (!next || !next.unlock) return null;
  const u = next.unlock;
  if (outlineProfileCount(state) < u.outlineProfiles) return null;
  if (dpSpent(state) < u.dpSpent) return null;
  if (upgradeLevel(state, "machineTier") < u.machineTier) return null;
  return next.id;
}

export function advanceStageIfReady(state: GameState): boolean {
  const next = canAdvance(state);
  if (next === null) return false;
  state.stage = next;
  if (next === 1) {
    fireMilestone(state, "stage1Unlock");
    state.channels.corkboard ??= { spawnAccumulator: 0 };
  }
  return true;
}
