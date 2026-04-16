import {
	autoExtractCooldownFor,
	autoRestoreCooldownFor,
	computeRegenFor,
	machineTierComputeMax,
	processAutoCooldownFor,
	revealStageCostsFor,
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

export function isUpgradeUnlocked(state: GameState, id: UpgradeId): boolean {
	const req = defs[id].requires;
	if (!req) return true;
	return upgradeLevel(state, req.upgrade) >= req.level;
}

export function upgradeCost(state: GameState, id: UpgradeId): number | null {
	const lvl = upgradeLevel(state, id);
	if (lvl >= maxLevel(id)) return null;
	return defs[id].costs[lvl]!;
}

export function canPurchase(state: GameState, id: UpgradeId): boolean {
	if (!isUpgradeUnlocked(state, id)) return false;
	const cost = upgradeCost(state, id);
	return cost !== null && state.dp >= cost;
}

export function purchaseUpgrade(state: GameState, id: UpgradeId): boolean {
	if (!isUpgradeUnlocked(state, id)) return false;
	const cost = upgradeCost(state, id);
	if (cost === null || state.dp < cost) return false;
	state.dp -= cost;
	const next = upgradeLevel(state, id) + 1;
	state.upgrades[id] = next;
	logInfo(state, `[INFO] ${defs[id].name} calibrated. Level ${next}.`);
	return true;
}

export function computeRegenPerSecond(state: GameState): number {
	return computeRegenFor(upgradeLevel(state, "computeRegen"));
}

export function autoExtractCooldownMs(state: GameState): number | null {
	return autoExtractCooldownFor(upgradeLevel(state, "autoExtract"));
}

export function autoRestoreCooldownMs(state: GameState): number | null {
	return autoRestoreCooldownFor(upgradeLevel(state, "autoRestore"));
}

export function autoProcessCooldownMs(state: GameState): number | null {
	return processAutoCooldownFor(upgradeLevel(state, "processAuto"));
}

export function revealStageCost(state: GameState, stage: 0 | 1 | 2): number {
	return revealStageCostsFor(upgradeLevel(state, "revealCost"))[stage];
}

export function totalProcessCost(
	state: GameState,
	fromStage: 0 | 1 | 2,
): number {
	let total = 0;
	for (let s = fromStage; s <= 2; s++) {
		total += revealStageCost(state, s as 0 | 1 | 2);
	}
	return total;
}

export function computeMax(state: GameState): number {
	return machineTierComputeMax(upgradeLevel(state, "machineTier"));
}
