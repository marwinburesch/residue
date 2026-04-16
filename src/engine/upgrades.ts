import { UPGRADE_FLAVOR } from "../data/narrative.ts";
import {
	AUTO_EXTRACT_COOLDOWNS_MS,
	AUTO_RESTORE_COOLDOWNS_MS,
	COMPUTE_MAX_BASE,
	MACHINE_TIER_COMPUTE_MAX,
	PROCESS_AUTO_COOLDOWNS_MS,
	REGEN_VALUES,
	REVEAL_STAGE_COSTS,
	upgrades as defs,
	type UpgradeId,
} from "../data/upgradeTree.ts";
import { logInfo, logSignal, type GameState } from "./state.ts";

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
	const flavor = UPGRADE_FLAVOR[id]?.[next - 1];
	if (flavor) logSignal(state, flavor);
	else logInfo(state, `[INFO] ${defs[id].name} calibrated. Level ${next}.`);
	return true;
}

export function computeRegenPerSecond(state: GameState): number {
	return REGEN_VALUES[upgradeLevel(state, "computeRegen")]!;
}

export function autoExtractCooldownMs(state: GameState): number | null {
	const lvl = upgradeLevel(state, "autoExtract");
	if (lvl === 0) return null;
	return AUTO_EXTRACT_COOLDOWNS_MS[lvl - 1] ?? null;
}

export function autoRestoreCooldownMs(state: GameState): number | null {
	const lvl = upgradeLevel(state, "autoRestore");
	if (lvl === 0) return null;
	return AUTO_RESTORE_COOLDOWNS_MS[lvl - 1] ?? null;
}

export function autoProcessCooldownMs(state: GameState): number | null {
	const lvl = upgradeLevel(state, "processAuto");
	if (lvl <= 1) return null;
	return PROCESS_AUTO_COOLDOWNS_MS[lvl - 2] ?? null;
}

export function revealStageCost(state: GameState, stage: 0 | 1 | 2): number {
	return REVEAL_STAGE_COSTS[upgradeLevel(state, "revealCost")]![stage]!;
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
	const lvl = upgradeLevel(state, "machineTier");
	if (lvl === 0) return COMPUTE_MAX_BASE;
	return MACHINE_TIER_COMPUTE_MAX[lvl - 1]!;
}
