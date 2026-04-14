import type { GameState } from "../engine/state.ts";
import { COMPUTE, SUSPICION } from "../data/tuning.ts";

export function renderResourceBar(root: HTMLElement, state: GameState): void {
  root.innerHTML = `
    <div class="res">
      <span class="res-label">Compute</span>
      <span class="res-value">${state.compute.toFixed(1)} / ${COMPUTE.max}</span>
    </div>
    <div class="res">
      <span class="res-label">Data points</span>
      <span class="res-value">${state.dp.toFixed(1)}</span>
    </div>
    <div class="res">
      <span class="res-label">System load</span>
      <span class="res-value ${state.suspicion.level >= SUSPICION.warningAt ? "res-warn" : ""}">${state.suspicion.level.toFixed(0)}</span>
    </div>
  `;
}
