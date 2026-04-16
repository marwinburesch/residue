import { Blocks, Toolbox, Upload } from "lucide-static";
import {
	UPGRADE_IDS,
	upgrades as defs,
	type UpgradeId,
} from "../data/upgradeTree.ts";
import type { GameState } from "../engine/state.ts";
import {
	canPurchase,
	isUpgradeUnlocked,
	maxLevel,
	purchaseUpgrade,
	upgradeCost,
	upgradeLevel,
} from "../engine/upgrades.ts";
import { createButton, type ButtonHandle } from "./button.ts";

const ICONS: Partial<Record<UpgradeId, string>> = {
	processAuto: Blocks,
	autoExtract: Upload,
	autoRestore: Toolbox,
};

type RowView = {
	row: HTMLElement;
	levelEl: HTMLElement;
	effectEl: HTMLElement;
	btn: ButtonHandle;
	lastLevel: number;
	lastCost: number | null;
	lastAffordable: boolean;
};

type PanelView = {
	root: HTMLElement;
	list: HTMLElement;
	rows: Map<UpgradeId, RowView>;
};

const views = new WeakMap<HTMLElement, PanelView>();

export function renderUpgradePanel(
	root: HTMLElement,
	state: GameState,
	onMutate: () => void,
): void {
	const view = views.get(root) ?? initView(root);
	for (const id of UPGRADE_IDS) {
		const unlocked = isUpgradeUnlocked(state, id);
		let rv = view.rows.get(id);
		if (!rv) {
			if (!unlocked) continue;
			rv = createRow(id, state, onMutate);
			view.rows.set(id, rv);
			view.list.appendChild(rv.row);
		}
		syncRow(rv, id, state);
	}
}

function initView(root: HTMLElement): PanelView {
	root.innerHTML = "";
	const heading = document.createElement("h2");
	heading.textContent = "Upgrades";
	root.appendChild(heading);

	const list = document.createElement("ul");
	list.className = "upgrade-list";
	root.appendChild(list);

	const view: PanelView = { root, list, rows: new Map() };
	views.set(root, view);
	return view;
}

function createRow(
	id: UpgradeId,
	state: GameState,
	onMutate: () => void,
): RowView {
	const def = defs[id];
	const row = document.createElement("li");
	row.className = "upgrade-row";

	const header = document.createElement("div");
	header.className = "upgrade-header";
	const title = document.createElement("span");
	title.className = "upgrade-title";
	const icon = ICONS[id];
	if (icon) {
		const iconEl = document.createElement("span");
		iconEl.className = "icon upgrade-icon";
		iconEl.innerHTML = icon;
		title.appendChild(iconEl);
	}
	const name = document.createElement("span");
	name.className = "upgrade-name";
	name.textContent = def.name;
	title.appendChild(name);
	const levelEl = document.createElement("span");
	levelEl.className = "upgrade-level";
	header.append(title, levelEl);

	const desc = document.createElement("p");
	desc.className = "upgrade-desc";
	desc.textContent = def.description;

	const effectEl = document.createElement("p");
	effectEl.className = "upgrade-effect";

	const btn = createButton({
		variant: "block",
		label: "Buy",
		onClick: () => {
			if (purchaseUpgrade(state, id)) onMutate();
		},
	});

	row.append(header, desc, effectEl, btn.el);

	return {
		row,
		levelEl,
		effectEl,
		btn,
		lastLevel: -1,
		lastCost: Number.NaN as unknown as number | null,
		lastAffordable: false,
	};
}

function syncRow(rv: RowView, id: UpgradeId, state: GameState): void {
	const def = defs[id];
	const level = upgradeLevel(state, id);
	const cost = upgradeCost(state, id);
	const affordable = canPurchase(state, id);
	if (
		rv.lastLevel === level &&
		rv.lastCost === cost &&
		rv.lastAffordable === affordable
	) {
		return;
	}
	rv.lastLevel = level;
	rv.lastCost = cost;
	rv.lastAffordable = affordable;

	rv.levelEl.textContent = `Lv ${level} / ${maxLevel(id)}`;

	if (cost === null) {
		rv.effectEl.textContent = `${def.effect(level)} — max`;
		rv.btn.update({ hidden: true });
		rv.row.classList.add("is-max");
		return;
	}
	rv.row.classList.remove("is-max");
	rv.effectEl.textContent = `${def.effect(level)} → ${def.effect(level + 1)}`;
	rv.btn.update({
		hidden: false,
		cost: { amount: cost, unit: "DP" },
		disabled: !affordable,
	});
}
