import { CHANNEL } from "../data/tuning.ts";
import type { Container, GameState } from "../engine/state.ts";
import {
	createContainerView,
	syncContainer,
	type ContainerView,
} from "./containerCard.ts";

type BrowserView = {
	root: HTMLElement;
	containers: Map<number, ContainerView>;
	placeholders: HTMLElement[];
	slotByContainer: Map<number, number>;
	lastSignature: string;
};

const views = new WeakMap<HTMLElement, BrowserView>();
const SLOT_COUNT = CHANNEL.receiptsContainerCap;

export function renderFragmentBrowser(
	root: HTMLElement,
	state: GameState,
	onMutate: () => void,
): void {
	const view = views.get(root) ?? initView(root);
	const liveIds = new Set(state.containers.map((c) => c.id));

	for (const id of view.slotByContainer.keys()) {
		if (!liveIds.has(id)) view.slotByContainer.delete(id);
	}

	const used = new Set(view.slotByContainer.values());
	for (const container of state.containers) {
		if (view.slotByContainer.has(container.id)) continue;
		for (let i = 0; i < SLOT_COUNT; i++) {
			if (!used.has(i)) {
				view.slotByContainer.set(container.id, i);
				used.add(i);
				break;
			}
		}
	}

	const slotOwners: (Container | null)[] = Array.from(
		{ length: SLOT_COUNT },
		() => null,
	);
	for (const container of state.containers) {
		const slot = view.slotByContainer.get(container.id);
		if (slot !== undefined) slotOwners[slot] = container;
	}

	for (const container of state.containers) {
		let cv = view.containers.get(container.id);
		if (!cv) {
			cv = createContainerView(container, state, onMutate);
			view.containers.set(container.id, cv);
		}
		syncContainer(cv, container, state, onMutate);
	}

	for (const [id, cv] of view.containers) {
		if (!liveIds.has(id)) {
			cv.card.remove();
			view.containers.delete(id);
		}
	}

	const signature = slotOwners.map((c) => (c ? c.id : "")).join(",");
	if (signature !== view.lastSignature) {
		for (let i = 0; i < SLOT_COUNT; i++) {
			const owner = slotOwners[i];
			const placeholder = view.placeholders[i]!;
			if (owner) {
				const cv = view.containers.get(owner.id)!;
				if (view.root.children[i] !== cv.card)
					view.root.insertBefore(cv.card, view.root.children[i] ?? null);
				placeholder.remove();
			} else {
				if (view.root.children[i] !== placeholder)
					view.root.insertBefore(placeholder, view.root.children[i] ?? null);
			}
		}
		view.lastSignature = signature;
	}
}

function initView(root: HTMLElement): BrowserView {
	root.innerHTML = "";
	const placeholders: HTMLElement[] = [];
	for (let i = 0; i < SLOT_COUNT; i++) {
		const ph = document.createElement("div");
		ph.className = "container-slot--empty";
		placeholders.push(ph);
		root.appendChild(ph);
	}
	const view: BrowserView = {
		root,
		containers: new Map(),
		placeholders,
		slotByContainer: new Map(),
		lastSignature: "",
	};
	views.set(root, view);
	return view;
}
