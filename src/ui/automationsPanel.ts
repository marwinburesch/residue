import { Blocks, Toolbox, Upload } from "lucide-static";
import type { GameState } from "../engine/state.ts";
import {
	automationStatuses,
	type AutomationId,
	type AutomationStatus,
} from "../engine/automations.ts";

const ICONS: Record<AutomationId, string> = {
	processAuto: Blocks,
	autoExtract: Upload,
	autoRestore: Toolbox,
};

const LABELS: Record<AutomationId, string> = {
	processAuto: "Auto-process",
	autoExtract: "Auto-extract",
	autoRestore: "Auto-restore",
};

type ChipView = {
	el: HTMLElement;
	timeEl: HTMLElement;
	lastTimeText: string;
	lastReady: boolean;
};

type HostView = {
	host: HTMLElement;
	chips: Map<AutomationId, ChipView>;
};

const views = new WeakMap<HTMLElement, HostView>();

export function renderAutomationChips(
	host: HTMLElement,
	state: GameState,
): void {
	const statuses = automationStatuses(state);
	const view = views.get(host) ?? { host, chips: new Map() };
	if (!views.has(host)) views.set(host, view);

	const seen = new Set<AutomationId>();
	for (const status of statuses) {
		seen.add(status.id);
		let chip = view.chips.get(status.id);
		if (!chip) {
			chip = createChip(status);
			view.chips.set(status.id, chip);
			host.appendChild(chip.el);
		}
		syncChip(chip, status);
	}
	for (const [id, chip] of view.chips) {
		if (!seen.has(id)) {
			chip.el.remove();
			view.chips.delete(id);
		}
	}
}

function createChip(status: AutomationStatus): ChipView {
	const el = document.createElement("span");
	el.className = "auto-chip";
	el.dataset.automation = status.id;
	el.title = LABELS[status.id];

	const iconEl = document.createElement("span");
	iconEl.className = "icon";
	iconEl.innerHTML = ICONS[status.id]!;

	const timeEl = document.createElement("span");
	timeEl.className = "auto-chip-time";

	el.append(iconEl, timeEl);

	return { el, timeEl, lastTimeText: "", lastReady: false };
}

function syncChip(chip: ChipView, status: AutomationStatus): void {
	const remainingMs = Math.max(0, status.cooldownMs - status.elapsedMs);
	const ready = status.progress >= 1;
	const text = ready ? "Ready" : `${(Math.ceil(remainingMs / 100) / 10).toFixed(1)}s`;
	if (text !== chip.lastTimeText) {
		chip.timeEl.textContent = text;
		chip.lastTimeText = text;
	}
	if (ready !== chip.lastReady) {
		chip.el.classList.toggle("is-ready", ready);
		chip.lastReady = ready;
	}
}
