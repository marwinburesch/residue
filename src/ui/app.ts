import { TICK_MS } from "../data/tuning.ts";
import { step } from "../engine/tick.ts";
import { logInfo } from "../engine/state.ts";
import { extractAllReady, isContainerReady } from "../engine/fragments.ts";
import { upgradeLevel } from "../engine/upgrades.ts";
import { suspicionThrottle } from "../engine/suspicion.ts";
import { loadOrInit, save, wipe } from "./storage.ts";
import { createButton, type ButtonHandle } from "./button.ts";
import { renderResourceBar } from "./resourceBar.ts";
import { renderFragmentBrowser } from "./fragmentBrowser.ts";
import { renderProfileRegistry } from "./profileRegistry.ts";
import { renderUpgradePanel } from "./upgradePanel.ts";
import { renderAutomationChips } from "./automationsPanel.ts";
import { renderLog } from "./log.ts";
import { applyToneStage } from "./toneController.ts";
import { loadTheme, toggleTheme } from "./themeController.ts";

const AUTOSAVE_MS = 5_000;

export function mountApp(_root: HTMLElement): void {
	const resources = requireEl("resources");
	const fragments = requireEl("fragments");
	const recordsToolbar = requireEl("records-toolbar");
	const registry = requireEl("registry");
	const upgradesEl = requireEl("upgrades");
	const log = requireEl("log");
	const channelsEl = requireEl("channels");
	const tabsEl = requireEl("tabs");
	mountTabs(tabsEl);

	const { state, offline } = loadOrInit(Date.now());
	const renderChannels = () => {
		const items = [
			`<li class="channel channel--active"><span class="channel-name">Discarded receipts</span><span class="channel-meta">Active</span></li>`,
		];
		if (state.channels.corkboard) {
			items.push(
				`<li class="channel channel--active"><span class="channel-name">Corkboard notes</span><span class="channel-meta">Active</span></li>`,
			);
		}
		channelsEl.innerHTML = `<h2>Channels</h2><ul class="channel-list">${items.join("")}</ul>`;
	};
	let wiped = false;
	mountThemeToggle(resources.parentElement ?? resources);
	const extractAllBtn = mountExtractAllButton(recordsToolbar, () => {
		if (extractAllReady(state) > 0) render();
	});
	const automationChipsEl = document.createElement("span");
	automationChipsEl.className = "auto-chips";
	recordsToolbar.appendChild(automationChipsEl);
	const throughputEl = document.createElement("span");
	throughputEl.className = "throughput-readout";
	throughputEl.hidden = true;
	recordsToolbar.appendChild(throughputEl);
	mountResetButton(resources.parentElement ?? resources, () => {
		wiped = true;
		wipe();
		location.reload();
	});
	if (offline) {
		logInfo(
			state,
			`[INFO] Resumed session. ${Math.round(offline.awardedDp)} DP reconciled over ${Math.round(offline.elapsedMs / 60_000)}m.`,
		);
	} else if (state.log.length === 0) {
		logInfo(state, "[INFO] Session initialised. OCR pipeline online.");
	}

	const render = () => {
		applyToneStage(state.stage);
		renderChannels();
		renderResourceBar(resources, state);
		const hasUpgrade = upgradeLevel(state, "extractAll") > 0;
		const anyReady = state.containers.some(isContainerReady);
		extractAllBtn.update({
			hidden: !hasUpgrade,
			disabled: !anyReady,
			dim: !anyReady,
		});
		const throttle = suspicionThrottle(state);
		if (throttle < 1) {
			throughputEl.hidden = false;
			throughputEl.textContent = `Throughput ${Math.round(throttle * 100)}%`;
			throughputEl.classList.toggle("throughput-readout--warn", throttle < 0.6);
		} else {
			throughputEl.hidden = true;
		}
		renderFragmentBrowser(fragments, state, render);
		renderAutomationChips(automationChipsEl, state);
		renderUpgradePanel(upgradesEl, state, render);
		renderProfileRegistry(registry, state);
		renderLog(log, state);
	};

	let lastTick = performance.now();
	let lastSave = Date.now();
	setInterval(() => {
		const now = performance.now();
		const dt = now - lastTick;
		lastTick = now;
		step(state, dt);
		render();
		const realNow = Date.now();
		if (!wiped && realNow - lastSave >= AUTOSAVE_MS) {
			save(state, realNow);
			lastSave = realNow;
		}
	}, TICK_MS);

	document.addEventListener("visibilitychange", () => {
		if (!wiped && document.visibilityState === "hidden")
			save(state, Date.now());
	});
	window.addEventListener("beforeunload", () => {
		if (!wiped) save(state, Date.now());
	});

	render();
}

const TABS: ReadonlyArray<{ id: string; label: string }> = [
	{ id: "records", label: "Records" },
	{ id: "ops", label: "Channels & Upgrades" },
	{ id: "registry", label: "Registry" },
];

function mountTabs(host: HTMLElement): void {
	const panels = document.querySelectorAll<HTMLElement>(
		"main > section[data-panel]",
	);
	const buttons: HTMLButtonElement[] = [];
	const activate = (id: string) => {
		for (const btn of buttons)
			btn.classList.toggle("is-active", btn.dataset.tab === id);
		for (const panel of panels)
			panel.classList.toggle("is-active", panel.dataset.panel === id);
	};
	for (const { id, label } of TABS) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "tab";
		btn.dataset.tab = id;
		btn.textContent = label;
		btn.addEventListener("click", () => activate(id));
		host.appendChild(btn);
		buttons.push(btn);
	}
	activate(TABS[0]!.id);
}

function mountThemeToggle(host: HTMLElement): void {
	const btn = createButton({
		variant: "inline",
		label: labelFor(loadTheme()),
		onClick: () => {
			const next = toggleTheme();
			btn.update({ label: labelFor(next) });
		},
	});
	btn.el.classList.add("btn--theme");
	host.appendChild(btn.el);
}

function labelFor(theme: "light" | "dark"): string {
	return theme === "light" ? "Dark" : "Light";
}

function mountExtractAllButton(
	host: HTMLElement,
	onClick: () => void,
): ButtonHandle {
	const btn = createButton({
		variant: "inline",
		label: "Extract all ready",
		onClick,
	});
	btn.update({ hidden: true });
	host.appendChild(btn.el);
	return btn;
}

function mountResetButton(host: HTMLElement, onConfirm: () => void): void {
	const btn = createButton({
		variant: "inline",
		label: "Reset",
		onClick: () => {
			if (!confirm("Wipe save and restart? This cannot be undone.")) return;
			onConfirm();
		},
	});
	btn.el.classList.add("btn--reset");
	host.appendChild(btn.el);
}

function requireEl(id: string): HTMLElement {
	const el = document.getElementById(id);
	if (!el) throw new Error(`missing #${id}`);
	return el;
}
