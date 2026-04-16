import type { GameState } from "../engine/state.ts";
import { SUSPICION } from "../data/tuning.ts";
import { computeMax } from "../engine/upgrades.ts";

type View = {
	computeEl: HTMLElement;
	dpEl: HTMLElement;
	loadEl: HTMLElement;
	lastCompute: string;
	lastDp: string;
	lastLoad: string;
	lastWarn: boolean;
};

const views = new WeakMap<HTMLElement, View>();

export function renderResourceBar(root: HTMLElement, state: GameState): void {
	const view = views.get(root) ?? initView(root);
	const compute = `${state.compute.toFixed(1)} / ${computeMax(state)}`;
	const dp = state.dp.toFixed(1);
	const load = state.suspicion.level.toFixed(0);
	const warn = state.suspicion.level >= SUSPICION.warningAt;
	if (compute !== view.lastCompute) {
		view.computeEl.textContent = compute;
		view.lastCompute = compute;
	}
	if (dp !== view.lastDp) {
		view.dpEl.textContent = dp;
		view.lastDp = dp;
	}
	if (load !== view.lastLoad) {
		view.loadEl.textContent = load;
		view.lastLoad = load;
	}
	if (warn !== view.lastWarn) {
		view.loadEl.classList.toggle("res-warn", warn);
		view.lastWarn = warn;
	}
}

function initView(root: HTMLElement): View {
	root.innerHTML = `
    <div class="res">
      <span class="res-label">Compute</span>
      <span class="res-value" data-role="compute"></span>
    </div>
    <div class="res">
      <span class="res-label">Data points</span>
      <span class="res-value" data-role="dp"></span>
    </div>
    <div class="res">
      <span class="res-label">System load</span>
      <span class="res-value" data-role="load"></span>
    </div>
  `;
	const view: View = {
		computeEl: root.querySelector('[data-role="compute"]') as HTMLElement,
		dpEl: root.querySelector('[data-role="dp"]') as HTMLElement,
		loadEl: root.querySelector('[data-role="load"]') as HTMLElement,
		lastCompute: "",
		lastDp: "",
		lastLoad: "",
		lastWarn: false,
	};
	views.set(root, view);
	return view;
}
