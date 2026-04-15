export type UpgradeId =
	| "computeRegen"
	| "autoExtract"
	| "autoRestore"
	| "revealCost";

export type UpgradeRequirement = { upgrade: UpgradeId; level: number };

export type UpgradeDef = {
	id: UpgradeId;
	name: string;
	description: string;
	costs: readonly number[];
	effect: (level: number) => string;
	requires?: UpgradeRequirement;
};

export const REGEN_VALUES = [0.5, 0.8, 1.2, 2.0] as const;

export const AUTO_EXTRACT_COOLDOWNS_MS = [
	10000, 6000, 4000, 2500, 1500, 1000,
] as const;

export const AUTO_RESTORE_COOLDOWNS_MS = [8000, 5000, 3000] as const;

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
	autoExtract: {
		id: "autoExtract",
		name: "Auto-extract",
		description: "Periodically extracts clean containers.",
		costs: [60, 160, 400, 900, 2000, 4500],
		effect: (lvl) => {
			if (lvl === 0) return "off";
			const ms = AUTO_EXTRACT_COOLDOWNS_MS[lvl - 1]!;
			return `every ${(ms / 1000).toFixed(1)}s`;
		},
	},
	autoRestore: {
		id: "autoRestore",
		name: "Auto-restore",
		description: "Periodically attempts to restore a corrupted fragment.",
		costs: [800, 2000, 5000],
		requires: { upgrade: "autoExtract", level: 3 },
		effect: (lvl) => {
			if (lvl === 0) return "off";
			const ms = AUTO_RESTORE_COOLDOWNS_MS[lvl - 1]!;
			return `every ${(ms / 1000).toFixed(1)}s`;
		},
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
	"autoExtract",
	"autoRestore",
	"revealCost",
];
