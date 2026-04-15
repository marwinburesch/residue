export const TICK_MS = 250;

export const COMPUTE = {
  startingAmount: 10,
  max: 50,
  regenPerSecond: 0.5,
} as const;

export const DP = {
  perFieldPerSecondGhost: 0.02,
  perFieldPerSecondOutline: 0.1,
} as const;

export const SUSPICION = {
  max: 100,
  decayPerSecond: 0.1,
  perRapidReveal: 3,
  rapidWindowMs: 1500,
  rapidThreshold: 3,
  warningAt: 25,
} as const;

export const REVEAL = {
  stageAdvanceMs: 1500,
  costPerManualStage: [3, 2, 1] as const,
  corruptionChance: 0.2,
  corruptionRestoreCost: 4,
  corruptionRestoreChance: 0.8,
  extractBonusDpPerField: 2,
} as const;

export const PROFILE = {
  matchConfidenceFloor: 0.5,
  outlineFieldThreshold: 3,
} as const;

export const CHANNEL = {
  receiptsSpawnPerSecond: 0.2,
  receiptsContainerCap: 6,
} as const;

export const RARITY_TIERS = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
] as const;
export type Rarity = (typeof RARITY_TIERS)[number];

export const RARITY: {
  weights: Record<Rarity, number>;
  fields: Record<Rarity, readonly [min: number, max: number]>;
  coherentFrom: Rarity;
} = {
  weights: {
    common: 600,
    uncommon: 250,
    rare: 100,
    epic: 40,
    legendary: 8,
    mythic: 2,
  },
  fields: {
    common: [2, 3],
    uncommon: [3, 4],
    rare: [4, 5],
    epic: [5, 6],
    legendary: [6, 7],
    mythic: [7, 7],
  },
  coherentFrom: "uncommon",
};

export const OFFLINE = {
  minIdleMs: 60_000,
  capMs: 8 * 60 * 60 * 1000,
  rate: 0.25,
} as const;
