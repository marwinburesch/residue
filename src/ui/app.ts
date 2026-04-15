import { TICK_MS } from "../data/tuning.ts";
import { step } from "../engine/tick.ts";
import { logInfo } from "../engine/state.ts";
import { loadOrInit, save } from "./storage.ts";
import { renderResourceBar } from "./resourceBar.ts";
import { renderFragmentBrowser } from "./fragmentBrowser.ts";
import { renderProfileRegistry } from "./profileRegistry.ts";
import { renderUpgradePanel } from "./upgradePanel.ts";
import { renderLog } from "./log.ts";

const AUTOSAVE_MS = 5_000;

export function mountApp(_root: HTMLElement): void {
  document.body.dataset.toneStage = "0";
  const resources = requireEl("resources");
  const fragments = requireEl("fragments");
  const registry = requireEl("registry");
  const upgradesEl = requireEl("upgrades");
  const log = requireEl("log");
  const channelsEl = requireEl("channels");
  channelsEl.innerHTML = `
    <h2>Channels</h2>
    <ul class="channel-list">
      <li class="channel channel--active">
        <span class="channel-name">Discarded receipts</span>
        <span class="channel-meta">Active</span>
      </li>
    </ul>
  `;

  const { state, offline } = loadOrInit(Date.now());
  if (offline) {
    logInfo(
      state,
      `[INFO] Resumed session. ${Math.round(offline.awardedDp)} DP reconciled over ${Math.round(offline.elapsedMs / 60_000)}m.`,
    );
  } else if (state.log.length === 0) {
    logInfo(state, "[INFO] Session initialised. OCR pipeline online.");
  }

  const render = () => {
    renderResourceBar(resources, state);
    renderFragmentBrowser(fragments, state, render);
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
    if (realNow - lastSave >= AUTOSAVE_MS) {
      save(state, realNow);
      lastSave = realNow;
    }
  }, TICK_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save(state, Date.now());
  });
  window.addEventListener("beforeunload", () => save(state, Date.now()));

  render();
}

function requireEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}
