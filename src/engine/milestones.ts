import { MILESTONES, type MilestoneKey } from "../data/narrative.ts";
import type { GameState } from "./state.ts";
import { logInfo, logWarn } from "./state.ts";

export function fireMilestone(state: GameState, key: MilestoneKey): void {
  if (state.milestonesFired.includes(key)) return;
  state.milestonesFired.push(key);
  const text = MILESTONES[key];
  if (text.startsWith("[WARN]")) logWarn(state, text);
  else logInfo(state, text);
}
