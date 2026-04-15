import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import {
  canPurchase,
  computeRegenPerSecond,
  containerCap,
  maxLevel,
  purchaseUpgrade,
  revealStageCost,
  upgradeCost,
  upgradeLevel,
} from "./upgrades.ts";
import {
  REGEN_VALUES,
  REVEAL_STAGE_COSTS,
  SLOT_VALUES,
  upgrades as defs,
} from "../data/upgradeTree.ts";
import { tickChannels } from "./fragments.ts";

describe("purchase", () => {
  test("deducts DP, increments level, logs", () => {
    const s = createState(1, 0);
    s.dp = 100;
    const cost = defs.computeRegen.costs[0]!;
    expect(purchaseUpgrade(s, "computeRegen")).toBe(true);
    expect(s.dp).toBe(100 - cost);
    expect(upgradeLevel(s, "computeRegen")).toBe(1);
    expect(s.log.at(-1)?.text).toContain("Compute throughput");
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
    for (let i = 0; i < maxLevel("slotExpansion"); i++) {
      expect(purchaseUpgrade(s, "slotExpansion")).toBe(true);
    }
    expect(upgradeCost(s, "slotExpansion")).toBeNull();
    expect(canPurchase(s, "slotExpansion")).toBe(false);
    expect(purchaseUpgrade(s, "slotExpansion")).toBe(false);
  });
});

describe("selectors", () => {
  test("return base value at level 0", () => {
    const s = createState(1, 0);
    expect(computeRegenPerSecond(s)).toBe(REGEN_VALUES[0]);
    expect(containerCap(s)).toBe(SLOT_VALUES[0]);
    expect(revealStageCost(s, 0)).toBe(REVEAL_STAGE_COSTS[0]![0]!);
  });

  test("return level-N value after purchase", () => {
    const s = createState(1, 0);
    s.upgrades.computeRegen = 2;
    s.upgrades.revealCost = 3;
    expect(computeRegenPerSecond(s)).toBe(REGEN_VALUES[2]!);
    expect(revealStageCost(s, 0)).toBe(REVEAL_STAGE_COSTS[3]![0]!);
    expect(revealStageCost(s, 0)).toBeGreaterThanOrEqual(1);
  });
});

describe("slot expansion feeds tickChannels", () => {
  test("raising slotExpansion lets more containers spawn", () => {
    const s = createState(1, 0);
    s.upgrades.slotExpansion = 1;
    tickChannels(s, 600_000);
    expect(s.containers.length).toBe(SLOT_VALUES[1]);
  });
});
