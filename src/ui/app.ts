import { ScanEye, Toolbox } from "lucide-static";
import { logInfo } from "../engine/state.ts";
import {
	extractAllReady,
	isContainerReady,
} from "../engine/containerLifecycle.ts";
import { fireMilestone } from "../engine/milestones.ts";
import { upgradeLevel } from "../engine/upgrades.ts";
import { suspicionThrottle } from "../engine/suspicion.ts";
import { loadOrInit, wipe } from "./storage.ts";
import { createButton, type ButtonHandle } from "./button.ts";
import { renderResourceBar } from "./resourceBar.ts";
import { renderFragmentBrowser } from "./fragmentBrowser.ts";
import { renderProfileRegistry } from "./profileRegistry.ts";
import { renderUpgradePanel } from "./upgradePanel.ts";
import { renderAutomationChips } from "./automationsPanel.ts";
import { renderLog } from "./log.ts";
import { applyToneStage } from "./toneController.ts";
import { mountTabs } from "./tabs.ts";
import { mountOverflowMenu } from "./overflowMenu.ts";
import { startGameLoop } from "./gameLoop.ts";

export function mountApp(_root: HTMLElement): void {
	const resourceBar = requireEl("resource-bar");
	const fragments = requireEl("fragments");
	const recordsToolbar = requireEl("records-toolbar");
	const registry = requireEl("registry");
	const upgradesEl = requireEl("upgrades");
	const logPanel = requireEl("log-panel");
	const channelsEl = requireEl("channels");
	const panelNav = requireEl("panel-nav");
	const scrim = requireEl("drawer-scrim");
	const overflowBtn = requireEl("overflow-btn");
	const overflowMenu = requireEl("overflow-menu");
	const topbar = requireEl("topbar");

	const setTopbarH = () => {
		document.documentElement.style.setProperty(
			"--topbar-h",
			`${topbar.offsetHeight}px`,
		);
	};
	setTopbarH();
	new ResizeObserver(setTopbarH).observe(topbar);

	mountTabs(panelNav, scrim);

	const { state, offline } = loadOrInit(Date.now());
	const loop = startGameLoop(state);

	mountOverflowMenu(overflowBtn, overflowMenu, {
		onReset: () => {
			loop.markWiped();
			wipe();
			location.reload();
		},
	});

	let lastCorkboard: boolean | null = null;
	const renderChannels = () => {
		const corkboard = !!state.channels.corkboard;
		if (corkboard === lastCorkboard) return;
		lastCorkboard = corkboard;
		const items = [
			`<li class="channel channel--active"><span class="channel-name">Discarded receipts</span><span class="channel-meta">Active</span></li>`,
		];
		if (corkboard) {
			items.push(
				`<li class="channel channel--active"><span class="channel-name">Corkboard notes</span><span class="channel-meta">Active</span></li>`,
			);
		}
		channelsEl.innerHTML = `<h2>Channels</h2><ul class="channel-list">${items.join("")}</ul>`;
	};

	const extractAllBtn = mountExtractAllButton(recordsToolbar, () => {
		if (extractAllReady(state) > 0) render();
	});
	mountRecordsLegend(recordsToolbar);
	const automationChipsEl = document.createElement("span");
	automationChipsEl.className = "auto-chips";
	recordsToolbar.appendChild(automationChipsEl);
	const throughputEl = document.createElement("span");
	throughputEl.className = "throughput-readout";
	throughputEl.hidden = true;
	recordsToolbar.appendChild(throughputEl);

	if (offline) {
		logInfo(
			state,
			`[INFO] Resumed session. ${Math.round(offline.awardedDp)} DP reconciled over ${Math.round(offline.elapsedMs / 60_000)}m.`,
		);
	} else if (state.log.length === 0) {
		logInfo(state, "[INFO] Session initialised. OCR pipeline online.");
		fireMilestone(state, "sessionStartGuide");
	}

	const render = () => {
		applyToneStage(state.stage);
		renderChannels();
		renderResourceBar(resourceBar, state);
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
		renderLog(logPanel, state);
	};

	const frame = () => {
		render();
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);

	render();
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

function mountRecordsLegend(host: HTMLElement): void {
	const legend = document.createElement("span");
	legend.className = "records-legend";
	legend.innerHTML = `
		<span class="records-legend__item"><span class="icon">${ScanEye}</span>Process</span>
		<span class="records-legend__item"><span class="icon">${Toolbox}</span>Restore</span>
	`;
	host.appendChild(legend);
}

function requireEl(id: string): HTMLElement {
	const el = document.getElementById(id);
	if (!el) throw new Error(`missing #${id}`);
	return el;
}
