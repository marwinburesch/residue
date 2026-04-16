export const TICK_MS = 50;

export const COMPUTE = {
	startingAmount: 10,
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
	throttleFrom: 25,
	throttleFloor: 0.25,
} as const;

export const REVEAL = {
	stageAdvanceMs: 2500,
	costPerManualStage: [3, 2, 1] as const,
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
	corruption: Record<Rarity, number>;
	coherentFrom: Rarity;
} = {
	weights: {
		common: 690,
		uncommon: 200,
		rare: 70,
		epic: 30,
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
	corruption: {
		common: 0.24,
		uncommon: 0.16,
		rare: 0.1,
		epic: 0.06,
		legendary: 0.03,
		mythic: 0.01,
	},
	coherentFrom: "uncommon",
};

export const OFFLINE = {
	minIdleMs: 60_000,
	capMs: 8 * 60 * 60 * 1000,
	rate: 0.25,
} as const;
