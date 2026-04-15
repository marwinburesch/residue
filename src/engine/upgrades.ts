import {
  REGEN_VALUES,
  REVEAL_STAGE_COSTS,
  SLOT_VALUES,
  upgrades as defs,
  type UpgradeId,
} from "../data/upgradeTree.ts";
import { logInfo, type GameState } from "./state.ts";

export function upgradeLevel(state: GameState, id: UpgradeId): number {
  return state.upgrades[id] ?? 0;
}

export function maxLevel(id: UpgradeId): number {
  return defs[id].costs.length;
}

export function upgradeCost(state: GameState, id: UpgradeId): number | null {
  const lvl = upgradeLevel(state, id);
  if (lvl >= maxLevel(id)) return null;
  return defs[id].costs[lvl]!;
}

export function canPurchase(state: GameState, id: UpgradeId): boolean {
  const cost = upgradeCost(state, id);
  return cost !== null && state.dp >= cost;
}

export function purchaseUpgrade(state: GameState, id: UpgradeId): boolean {
  const cost = upgradeCost(state, id);
  if (cost === null || state.dp < cost) return false;
  state.dp -= cost;
  const next = upgradeLevel(state, id) + 1;
  state.upgrades[id] = next;
  logInfo(state, `[INFO] ${defs[id].name} calibrated. Level ${next}.`);
  return true;
}

export function computeRegenPerSecond(state: GameState): number {
  return REGEN_VALUES[upgradeLevel(state, "computeRegen")]!;
}

export function containerCap(state: GameState): number {
  return SLOT_VALUES[upgradeLevel(state, "slotExpansion")]!;
}

export function revealStageCost(state: GameState, stage: 0 | 1 | 2): number {
  return REVEAL_STAGE_COSTS[upgradeLevel(state, "revealCost")]![stage]!;
}
