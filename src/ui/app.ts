import { TICK_MS } from "../data/tuning.ts";
import { step } from "../engine/tick.ts";
import { logInfo } from "../engine/state.ts";
import { loadOrInit, save, wipe } from "./storage.ts";
import { createButton } from "./button.ts";
import { renderResourceBar } from "./resourceBar.ts";
import { renderFragmentBrowser } from "./fragmentBrowser.ts";
import { renderProfileRegistry } from "./profileRegistry.ts";
import { renderUpgradePanel } from "./upgradePanel.ts";
import { renderLog } from "./log.ts";
import { applyToneStage } from "./toneController.ts";

const AUTOSAVE_MS = 5_000;

export function mountApp(_root: HTMLElement): void {
  const resources = requireEl("resources");
  const fragments = requireEl("fragments");
  const registry = requireEl("registry");
  const upgradesEl = requireEl("upgrades");
  const log = requireEl("log");
  const channelsEl = requireEl("channels");
  const tabsEl = requireEl("tabs");
  channelsEl.innerHTML = `
    <h2>Channels</h2>
    <ul class="channel-list">
      <li class="channel channel--active">
        <span class="channel-name">Discarded receipts</span>
        <span class="channel-meta">Active</span>
      </li>
    </ul>
  `;
  mountTabs(tabsEl);

  const { state, offline } = loadOrInit(Date.now());
  let wiped = false;
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
    if (!wiped && realNow - lastSave >= AUTOSAVE_MS) {
      save(state, realNow);
      lastSave = realNow;
    }
  }, TICK_MS);

  document.addEventListener("visibilitychange", () => {
    if (!wiped && document.visibilityState === "hidden") save(state, Date.now());
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
  const panels = document.querySelectorAll<HTMLElement>("main > section[data-panel]");
  const buttons: HTMLButtonElement[] = [];
  const activate = (id: string) => {
    for (const btn of buttons) btn.classList.toggle("is-active", btn.dataset.tab === id);
    for (const panel of panels) panel.classList.toggle("is-active", panel.dataset.panel === id);
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
