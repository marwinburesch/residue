import { BOOT_LINE_MS } from "../data/narrative.ts";
import { type StageId, stageDef } from "../data/stageConfig.ts";
import type { GameState } from "../engine/state.ts";

type Mounted = {
	stageId: StageId;
	root: HTMLElement;
	button: HTMLButtonElement;
	onKeydown: (e: KeyboardEvent) => void;
	ready: boolean;
	onAcknowledge: () => void;
};

let mounted: Mounted | null = null;

export function renderStageTransition(
	host: HTMLElement,
	state: GameState,
	onAcknowledge: () => void,
): void {
	const pending = state.pendingStageTransition;

	if (pending === null) {
		if (mounted) unmount();
		return;
	}

	if (mounted && mounted.stageId === pending) {
		mounted.onAcknowledge = onAcknowledge;
		return;
	}

	if (mounted) unmount();
	mounted = mount(host, pending, onAcknowledge);
}

function mount(
	host: HTMLElement,
	stageId: StageId,
	onAcknowledge: () => void,
): Mounted {
	const transition = stageDef(stageId).transition;
	if (!transition) {
		throw new Error(`stage ${stageId} has no transition defined`);
	}

	const root = document.createElement("div");
	root.className = "stage-transition";
	root.setAttribute("role", "dialog");
	root.setAttribute("aria-modal", "true");
	root.innerHTML = `
		<div class="stage-transition-inner">
			<h2 class="stage-transition-title"></h2>
			<pre class="stage-transition-log" aria-live="polite"></pre>
			<button type="button" class="stage-transition-dismiss" disabled></button>
		</div>
	`;
	host.appendChild(root);

	const title = root.querySelector<HTMLElement>(".stage-transition-title")!;
	const log = root.querySelector<HTMLElement>(".stage-transition-log")!;
	const button = root.querySelector<HTMLButtonElement>(
		".stage-transition-dismiss",
	)!;

	title.textContent = transition.title;
	button.textContent = transition.dismissLabel;

	const reduced = prefersReducedMotion();
	const state: Mounted = {
		stageId,
		root,
		button,
		onKeydown: () => {},
		ready: false,
		onAcknowledge,
	};

	const enable = () => {
		state.ready = true;
		button.disabled = false;
		button.focus();
	};

	const dismiss = () => {
		if (!state.ready) return;
		state.onAcknowledge();
	};

	state.onKeydown = (e: KeyboardEvent) => {
		if (e.key === "Escape" && state.ready) {
			e.preventDefault();
			dismiss();
		}
	};

	button.addEventListener("click", dismiss);
	document.addEventListener("keydown", state.onKeydown);

	if (reduced) {
		log.textContent = transition.lines.join("\n");
		enable();
	} else {
		let i = 0;
		const tick = () => {
			if (!mounted || mounted.root !== root) return;
			if (i < transition.lines.length) {
				log.textContent += (i === 0 ? "" : "\n") + transition.lines[i];
				i++;
				setTimeout(tick, BOOT_LINE_MS);
			} else {
				enable();
			}
		};
		setTimeout(tick, BOOT_LINE_MS);
	}

	return state;
}

function unmount(): void {
	if (!mounted) return;
	document.removeEventListener("keydown", mounted.onKeydown);
	const { root } = mounted;
	root.classList.add("stage-transition--leaving");
	setTimeout(() => root.remove(), 200);
	mounted = null;
}

function prefersReducedMotion(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}
