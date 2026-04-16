import type { GameState } from "./state.ts";
import {
	autoExtractCooldownMs,
	autoProcessCooldownMs,
	autoRestoreCooldownMs,
	upgradeLevel,
} from "./upgrades.ts";

export type AutomationId = "processAuto" | "autoExtract" | "autoRestore";

export type AutomationStatus = {
	id: AutomationId;
	label: string;
	level: number;
	cooldownMs: number;
	elapsedMs: number;
	progress: number;
};

type Spec = {
	id: AutomationId;
	label: string;
	cooldown: (state: GameState) => number | null;
	elapsed: (state: GameState) => number;
};

const SPECS: readonly Spec[] = [
	{
		id: "processAuto",
		label: "Process automation",
		cooldown: autoProcessCooldownMs,
		elapsed: (s) => s.processAutoTimer,
	},
	{
		id: "autoExtract",
		label: "Auto-extract",
		cooldown: autoExtractCooldownMs,
		elapsed: (s) => s.autoExtractTimer,
	},
	{
		id: "autoRestore",
		label: "Auto-restore",
		cooldown: autoRestoreCooldownMs,
		elapsed: (s) => s.autoRestoreTimer,
	},
];

export function automationStatuses(state: GameState): AutomationStatus[] {
	const out: AutomationStatus[] = [];
	for (const spec of SPECS) {
		const cooldownMs = spec.cooldown(state);
		if (cooldownMs === null) continue;
		const elapsedMs = spec.elapsed(state);
		const progress =
			cooldownMs > 0 ? Math.max(0, Math.min(1, elapsedMs / cooldownMs)) : 1;
		out.push({
			id: spec.id,
			label: spec.label,
			level: upgradeLevel(state, spec.id),
			cooldownMs,
			elapsedMs,
			progress,
		});
	}
	return out;
}
