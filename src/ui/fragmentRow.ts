import { ScanEye, Toolbox } from "lucide-static";
import { REVEAL } from "../data/tuning.ts";
import type { Fragment, GameState } from "../engine/state.ts";
import {
	restoreCorrupted,
	startProcessing,
} from "../engine/containerLifecycle.ts";
import { totalProcessCost } from "../engine/upgrades.ts";
import { createButton, type ButtonHandle } from "./button.ts";
import { costButton } from "./costButton.ts";

const GLYPHS = "▓▒░█#@%&*+".split("");

export type FragmentView = {
	row: HTMLElement;
	valueEl: HTMLElement;
	actionBtn: ButtonHandle;
	lastStage: number;
	lastCorrupted: boolean;
	lastResolved: boolean;
	lastCost: number;
	lastAffordable: boolean;
	lastProcessing: boolean;
	lostAnimating: boolean;
};

export function createFragmentView(
	fragment: Fragment,
	state: GameState,
	onMutate: () => void,
): FragmentView {
	const row = document.createElement("div");
	row.className = "fragment-row";

	const label = document.createElement("span");
	label.className = "fragment-label";
	label.textContent = fragment.label;

	const valueEl = document.createElement("span");
	valueEl.className = "fragment-value";

	const actionBtn = createButton({
		variant: "icon",
		label: "Process",
		icon: ScanEye,
		onClick: () => {
			if (fragment.corrupted) {
				if (restoreCorrupted(state, fragment.id)) onMutate();
			} else if (startProcessing(state, fragment.id)) onMutate();
		},
	});

	row.append(label, valueEl, actionBtn.el);

	return {
		row,
		valueEl,
		actionBtn,
		lastStage: -1,
		lastCorrupted: !fragment.corrupted,
		lastResolved: !fragment.resolved,
		lastCost: -1,
		lastAffordable: false,
		lastProcessing: false,
		lostAnimating: false,
	};
}

export function syncFragment(
	fv: FragmentView,
	fragment: Fragment,
	state: GameState,
): void {
	const nextCost = fragment.corrupted
		? REVEAL.corruptionRestoreCost
		: !fragment.processing && fragment.stage < 3
			? totalProcessCost(state, fragment.stage as 0 | 1 | 2)
			: -1;
	const affordable = nextCost >= 0 && state.compute >= nextCost;
	if (
		fv.lastStage === fragment.stage &&
		fv.lastCorrupted === fragment.corrupted &&
		fv.lastCost === nextCost &&
		fv.lastAffordable === affordable &&
		fv.lastProcessing === fragment.processing
	) {
		return;
	}
	const visualDirty =
		fv.lastStage !== fragment.stage || fv.lastCorrupted !== fragment.corrupted;
	if (visualDirty) fv.valueEl.textContent = obscure(fragment);
	fv.lastStage = fragment.stage;
	fv.lastCorrupted = fragment.corrupted;
	fv.lastCost = nextCost;
	fv.lastAffordable = affordable;
	fv.lastProcessing = fragment.processing;

	if (fragment.corrupted) {
		fv.actionBtn.update({
			...costButton(REVEAL.corruptionRestoreCost, state.compute),
			label: "Restore",
			icon: Toolbox,
		});
	} else if (!fragment.processing && fragment.stage < 3) {
		fv.actionBtn.update({
			...costButton(nextCost, state.compute),
			label: "Process",
			icon: ScanEye,
		});
	} else {
		fv.actionBtn.update({ hidden: true });
	}
}

function obscure(fragment: Fragment): string {
	if (fragment.corrupted) return "░░ corrupted ░░";
	const visibleChars =
		fragment.stage >= 3
			? fragment.value.length
			: Math.ceil((fragment.stage / 3) * fragment.value.length);
	let out = "";
	for (let i = 0; i < fragment.value.length; i++) {
		if (i < visibleChars) {
			out += fragment.value[i];
		} else {
			const ch = fragment.value[i];
			if (ch === " ") out += " ";
			else out += GLYPHS[(fragment.id + i) % GLYPHS.length];
		}
	}
	return out;
}
