import {
  UPGRADE_IDS,
  upgrades as defs,
  type UpgradeId,
} from "../data/upgradeTree.ts";
import type { GameState } from "../engine/state.ts";
import {
  canPurchase,
  maxLevel,
  purchaseUpgrade,
  upgradeCost,
  upgradeLevel,
} from "../engine/upgrades.ts";

type RowView = {
  row: HTMLElement;
  levelEl: HTMLElement;
  effectEl: HTMLElement;
  btn: HTMLButtonElement;
  lastLevel: number;
  lastCost: number | null;
  lastAffordable: boolean;
};

type PanelView = {
  root: HTMLElement;
  rows: Map<UpgradeId, RowView>;
};

const views = new WeakMap<HTMLElement, PanelView>();

export function renderUpgradePanel(
  root: HTMLElement,
  state: GameState,
  onMutate: () => void,
): void {
  const view = views.get(root) ?? initView(root, state, onMutate);
  for (const id of UPGRADE_IDS) {
    syncRow(view.rows.get(id)!, id, state);
  }
}

function initView(
  root: HTMLElement,
  state: GameState,
  onMutate: () => void,
): PanelView {
  root.innerHTML = "";
  const heading = document.createElement("h2");
  heading.textContent = "Upgrades";
  root.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "upgrade-list";
  root.appendChild(list);

  const rows = new Map<UpgradeId, RowView>();
  for (const id of UPGRADE_IDS) {
    const rv = createRow(id, state, onMutate);
    rows.set(id, rv);
    list.appendChild(rv.row);
  }
  const view: PanelView = { root, rows };
  views.set(root, view);
  return view;
}

function createRow(
  id: UpgradeId,
  state: GameState,
  onMutate: () => void,
): RowView {
  const def = defs[id];
  const row = document.createElement("li");
  row.className = "upgrade-row";

  const header = document.createElement("div");
  header.className = "upgrade-header";
  const name = document.createElement("span");
  name.className = "upgrade-name";
  name.textContent = def.name;
  const levelEl = document.createElement("span");
  levelEl.className = "upgrade-level";
  header.append(name, levelEl);

  const desc = document.createElement("p");
  desc.className = "upgrade-desc";
  desc.textContent = def.description;

  const effectEl = document.createElement("p");
  effectEl.className = "upgrade-effect";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "upgrade-buy";
  btn.addEventListener("click", () => {
    if (purchaseUpgrade(state, id)) onMutate();
  });

  row.append(header, desc, effectEl, btn);

  return {
    row,
    levelEl,
    effectEl,
    btn,
    lastLevel: -1,
    lastCost: Number.NaN as unknown as number | null,
    lastAffordable: false,
  };
}

function syncRow(rv: RowView, id: UpgradeId, state: GameState): void {
  const def = defs[id];
  const level = upgradeLevel(state, id);
  const cost = upgradeCost(state, id);
  const affordable = canPurchase(state, id);
  if (
    rv.lastLevel === level &&
    rv.lastCost === cost &&
    rv.lastAffordable === affordable
  ) {
    return;
  }
  rv.lastLevel = level;
  rv.lastCost = cost;
  rv.lastAffordable = affordable;

  rv.levelEl.textContent = `Lv ${level} / ${maxLevel(id)}`;

  if (cost === null) {
    rv.effectEl.textContent = `${def.effect(level)} — max`;
    rv.btn.hidden = true;
    rv.row.classList.add("is-max");
    return;
  }
  rv.row.classList.remove("is-max");
  rv.effectEl.textContent = `${def.effect(level)} → ${def.effect(level + 1)}`;
  rv.btn.hidden = false;
  rv.btn.textContent = `Buy · ${cost} DP`;
  rv.btn.disabled = !affordable;
}
