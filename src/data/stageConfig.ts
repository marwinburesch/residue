export type StageId = 0 | 1;

export type StageUnlock = {
	outlineProfiles: number;
	dpSpent: number;
	machineTier: number;
};

export type StageTransition = {
	title: string;
	lines: readonly string[];
	dismissLabel: string;
};

export type StageDef = {
	id: StageId;
	label: string;
	unlock: StageUnlock | null;
	transition?: StageTransition;
};

export const STAGES: readonly StageDef[] = [
	{ id: 0, label: "Field extraction", unlock: null },
	{
		id: 1,
		label: "Entity extraction",
		unlock: { outlineProfiles: 15, dpSpent: 300, machineTier: 2 },
		transition: {
			title: "Rig expansion online",
			lines: [
				"[SIGNAL] Secondary channel requisitioned.",
				"mounting channel: corkboard ............ ok",
				"profile engine: entity resolution ...... ok",
				"subtitle reclassified → Entity Extraction",
				"operator did not ask why.",
			],
			dismissLabel: "[ Resume shift ]",
		},
	},
];

export function stageDef(id: StageId): StageDef {
	return STAGES[id]!;
}
