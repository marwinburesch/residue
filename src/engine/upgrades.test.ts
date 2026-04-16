import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import {
	autoExtractCooldownMs,
	autoRestoreCooldownMs,
	canPurchase,
	computeRegenPerSecond,
	isUpgradeUnlocked,
	maxLevel,
	purchaseUpgrade,
	revealStageCost,
	upgradeCost,
	upgradeLevel,
} from "./upgrades.ts";
import {
	AUTO_EXTRACT_COOLDOWNS_MS,
	AUTO_RESTORE_COOLDOWNS_MS,
	REGEN_VALUES,
	REVEAL_STAGE_COSTS,
	upgrades as defs,
} from "../data/upgradeTree.ts";

describe("purchase", () => {
	test("deducts DP, increments level, logs", () => {
		const s = createState(1, 0);
		s.dp = 100;
		const cost = defs.computeRegen.costs[0]!;
		expect(purchaseUpgrade(s, "computeRegen")).toBe(true);
		expect(s.dp).toBe(100 - cost);
		expect(upgradeLevel(s, "computeRegen")).toBe(1);
		expect(s.log.at(-1)?.kind).toBe("signal");
	});

	test("fails and does not mutate when DP insufficient", () => {
		const s = createState(1, 0);
		s.dp = 1;
		expect(purchaseUpgrade(s, "computeRegen")).toBe(false);
		expect(s.dp).toBe(1);
		expect(upgradeLevel(s, "computeRegen")).toBe(0);
	});

	test("returns null cost and blocks purchase at max level", () => {
		const s = createState(1, 0);
		s.dp = 99_999;
		for (let i = 0; i < maxLevel("autoExtract"); i++) {
			expect(purchaseUpgrade(s, "autoExtract")).toBe(true);
		}
		expect(upgradeCost(s, "autoExtract")).toBeNull();
		expect(canPurchase(s, "autoExtract")).toBe(false);
		expect(purchaseUpgrade(s, "autoExtract")).toBe(false);
	});
});

describe("selectors", () => {
	test("return base value at level 0", () => {
		const s = createState(1, 0);
		expect(computeRegenPerSecond(s)).toBe(REGEN_VALUES[0]);
		expect(autoExtractCooldownMs(s)).toBeNull();
		expect(autoRestoreCooldownMs(s)).toBeNull();
		expect(revealStageCost(s, 0)).toBe(REVEAL_STAGE_COSTS[0]![0]!);
	});

	test("return level-N value after purchase", () => {
		const s = createState(1, 0);
		s.upgrades.computeRegen = 2;
		s.upgrades.revealCost = 3;
		s.upgrades.autoExtract = 3;
		s.upgrades.autoRestore = 2;
		expect(computeRegenPerSecond(s)).toBe(REGEN_VALUES[2]!);
		expect(revealStageCost(s, 0)).toBe(REVEAL_STAGE_COSTS[3]![0]!);
		expect(autoExtractCooldownMs(s)).toBe(AUTO_EXTRACT_COOLDOWNS_MS[2]!);
		expect(autoRestoreCooldownMs(s)).toBe(AUTO_RESTORE_COOLDOWNS_MS[1]!);
	});
});

describe("unlock gating", () => {
	test("autoRestore is locked until autoExtract tier 3", () => {
		const s = createState(1, 0);
		s.dp = 99_999;
		expect(isUpgradeUnlocked(s, "autoRestore")).toBe(false);
		expect(canPurchase(s, "autoRestore")).toBe(false);
		expect(purchaseUpgrade(s, "autoRestore")).toBe(false);
		s.upgrades.autoExtract = 3;
		expect(isUpgradeUnlocked(s, "autoRestore")).toBe(true);
		expect(purchaseUpgrade(s, "autoRestore")).toBe(true);
	});
});
