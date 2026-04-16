import type { Container, GameState } from "../engine/state.ts";
import {
	extractContainer,
	fragmentProcessCost,
	isContainerReady,
	processAllInContainer,
} from "../engine/containerLifecycle.ts";
import { upgradeLevel } from "../engine/upgrades.ts";
import { createButton, type ButtonHandle } from "./button.ts";
import { costButton } from "./costButton.ts";
import {
	createFragmentView,
	syncFragment,
	type FragmentView,
} from "./fragmentRow.ts";

export type ContainerView = {
	card: HTMLElement;
	body: HTMLElement;
	extractBtn: ButtonHandle;
	processAllBtn: ButtonHandle;
	fragments: Map<number, FragmentView>;
	lastReady: boolean | null;
};

export function createContainerView(
	container: Container,
	state: GameState,
	onMutate: () => void,
): ContainerView {
	const card = document.createElement("article");
	card.className = `container-card rarity-${container.rarity ?? "common"}`;
	const title = document.createElement("h3");
	title.textContent = `${sourceLabel(container.channel)} #${container.id}`;
	if (container.rarity && container.rarity !== "common") {
		const badge = document.createElement("span");
		badge.className = "rarity-badge";
		const dot = document.createElement("span");
		dot.className = "rarity-dot";
		const label = document.createElement("span");
		label.className = "rarity-label";
		label.textContent = container.rarity;
		badge.append(dot, label);
		card.appendChild(badge);
	}
	const body = document.createElement("div");
	body.className = "container-body";
	const extractBtn = createButton({
		variant: "block",
		label: "Extract",
		dim: true,
		onClick: () => {
			if (extractContainer(state, container.id)) onMutate();
		},
	});
	const processAllBtn = createButton({
		variant: "block",
		label: "Process all",
		dim: true,
		onClick: () => {
			if (processAllInContainer(state, container.id) > 0) onMutate();
		},
	});
	processAllBtn.update({ hidden: true });
	card.append(title, body, processAllBtn.el, extractBtn.el);
	return {
		card,
		body,
		extractBtn,
		processAllBtn,
		fragments: new Map(),
		lastReady: null,
	};
}

export function syncContainer(
	cv: ContainerView,
	container: Container,
	state: GameState,
	onMutate: () => void,
): void {
	const liveIds = new Set<number>();
	for (const fragment of container.fragments) {
		const existing = cv.fragments.get(fragment.id);
		if (
			fragment.resolved &&
			fragment.corrupted &&
			existing &&
			!existing.lostAnimating
		) {
			existing.lostAnimating = true;
			existing.row.classList.add("fragment-row--lost");
			existing.actionBtn.update({ hidden: true });
			existing.row.addEventListener(
				"animationend",
				() => {
					existing.row.remove();
					cv.fragments.delete(fragment.id);
				},
				{ once: true },
			);
		}
		if (existing?.lostAnimating) {
			liveIds.add(fragment.id);
			continue;
		}
		if (fragment.resolved) continue;
		liveIds.add(fragment.id);
		let fv = existing;
		if (!fv) {
			fv = createFragmentView(fragment, state, onMutate);
			cv.fragments.set(fragment.id, fv);
			cv.body.appendChild(fv.row);
		}
		syncFragment(fv, fragment, state);
	}
	for (const [id, fv] of cv.fragments) {
		if (!liveIds.has(id)) {
			fv.row.remove();
			cv.fragments.delete(id);
		}
	}
	const ready = isContainerReady(container);
	if (ready !== cv.lastReady) {
		cv.extractBtn.update({
			label: ready ? "Extract" : "Processing…",
			disabled: !ready,
			dim: !ready,
		});
		cv.card.classList.toggle("is-ready", ready);
		cv.lastReady = ready;
	}

	if (upgradeLevel(state, "processAuto") < 1) {
		cv.processAllBtn.update({ hidden: true });
		return;
	}
	let totalCost = 0;
	let eligible = 0;
	for (const f of container.fragments) {
		const cost = fragmentProcessCost(state, f);
		if (cost === null) continue;
		totalCost += cost;
		eligible++;
	}
	if (eligible === 0) {
		cv.processAllBtn.update({ hidden: true });
		return;
	}
	cv.processAllBtn.update({
		...costButton(totalCost, state.compute),
		label: "Process all",
	});
}

function sourceLabel(channel: Container["channel"]): string {
	return channel === "corkboard" ? "Note" : "Receipt";
}
