export type UpgradeId = "computeRegen" | "slotExpansion" | "revealCost";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  description: string;
  costs: readonly number[];
  effect: (level: number) => string;
};

export const REGEN_VALUES = [0.5, 0.8, 1.2, 2.0] as const;
export const SLOT_VALUES = [6, 8, 10, 13] as const;
export const REVEAL_STAGE_COSTS: readonly (readonly [number, number, number])[] = [
  [3, 2, 1],
  [2, 2, 1],
  [2, 1, 1],
  [1, 1, 1],
];

export const upgrades: Record<UpgradeId, UpgradeDef> = {
  computeRegen: {
    id: "computeRegen",
    name: "Compute throughput",
    description: "Background Compute accrual rate.",
    costs: [40, 100, 240],
    effect: (lvl) => `${REGEN_VALUES[lvl]!.toFixed(2)} c/s`,
  },
  slotExpansion: {
    id: "slotExpansion",
    name: "Source slots",
    description: "Receipts that may queue at once.",
    costs: [60, 160, 400],
    effect: (lvl) => `${SLOT_VALUES[lvl]} containers`,
  },
  revealCost: {
    id: "revealCost",
    name: "Reveal efficiency",
    description: "Compute per manual reveal stage.",
    costs: [60, 150, 360],
    effect: (lvl) => REVEAL_STAGE_COSTS[lvl]!.join(" / "),
  },
};

export const UPGRADE_IDS: readonly UpgradeId[] = [
  "computeRegen",
  "slotExpansion",
  "revealCost",
];
