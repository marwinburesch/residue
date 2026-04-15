export type UpgradeId =
	| "computeRegen"
	| "autoExtract"
	| "autoRestore"
	| "revealCost"
	| "machineTier"
	| "processAuto"
	| "extractAll";

export type UpgradeRequirement = { upgrade: UpgradeId; level: number };

export type UpgradeDef = {
	id: UpgradeId;
	name: string;
	description: string;
	costs: readonly number[];
	effect: (level: number) => string;
	requires?: UpgradeRequirement;
};

export const COMPUTE_MAX_BASE = 50;

export const REGEN_VALUES = [0.5, 0.8, 1.2, 2.0] as const;

export const AUTO_EXTRACT_COOLDOWNS_MS = [
	10000, 6000, 4000, 2500, 1500, 1000,
] as const;

export const AUTO_RESTORE_COOLDOWNS_MS = [8000, 5000, 3000] as const;

export const PROCESS_AUTO_COOLDOWNS_MS = [8000, 4000, 2000] as const;

export const MACHINE_TIER_NAMES = [
	"CPU upgrade",
	"Expansion slot",
	"Co-processor",
] as const;

export const MACHINE_TIER_COMPUTE_MAX = [75, 110, 160] as const;

export const REVEAL_STAGE_COSTS: readonly (readonly [
	number,
	number,
	number,
])[] = [
	[2, 1, 1],
	[1, 1, 1],
	[1, 1, 0],
	[1, 0, 0],
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
		name: "Processing efficiency",
		description: "Compute to start processing (per remaining stage).",
		costs: [60, 150, 360],
		effect: (lvl) => REVEAL_STAGE_COSTS[lvl]!.join(" / "),
	},
	machineTier: {
		id: "machineTier",
		name: "Rig expansion",
		description: "Physical hardware. Raises max Compute.",
		costs: [120, 300, 750],
		effect: (lvl) =>
			lvl === 0
				? `max ${COMPUTE_MAX_BASE} c`
				: `${MACHINE_TIER_NAMES[lvl - 1]} — max ${MACHINE_TIER_COMPUTE_MAX[lvl - 1]} c`,
	},
	processAuto: {
		id: "processAuto",
		name: "Process automation",
		description: "Batch-process containers; higher tiers auto-process fragments.",
		costs: [150, 500, 1500, 4000],
		effect: (lvl) => {
			if (lvl === 0) return "off";
			if (lvl === 1) return "batch button";
			const ms = PROCESS_AUTO_COOLDOWNS_MS[lvl - 2]!;
			return `every ${(ms / 1000).toFixed(1)}s`;
		},
	},
	extractAll: {
		id: "extractAll",
		name: "Bulk extraction",
		description: "Adds a toolbar button to extract every ready container at once.",
		costs: [200],
		effect: (lvl) => (lvl === 0 ? "off" : "on"),
	},
};

export const UPGRADE_IDS: readonly UpgradeId[] = [
	"computeRegen",
	"autoExtract",
	"autoRestore",
	"revealCost",
	"machineTier",
	"processAuto",
	"extractAll",
];
