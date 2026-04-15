export type StageId = 0 | 1;

export type StageUnlock = {
	outlineProfiles: number;
	dpSpent: number;
	machineTier: number;
};

export type StageDef = {
	id: StageId;
	label: string;
	unlock: StageUnlock | null;
};

export const STAGES: readonly StageDef[] = [
	{ id: 0, label: "Field extraction", unlock: null },
	{
		id: 1,
		label: "Entity extraction",
		unlock: { outlineProfiles: 15, dpSpent: 300, machineTier: 2 },
	},
];

export function stageDef(id: StageId): StageDef {
	return STAGES[id]!;
}
