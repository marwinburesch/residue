import { CHANNEL, REVEAL } from "../data/tuning.ts";
import type { Container, Fragment, GameState } from "../engine/state.ts";
import {
  advanceReveal,
  extractContainer,
  isContainerReady,
  restoreCorrupted,
} from "../engine/fragments.ts";
import { revealStageCost } from "../engine/upgrades.ts";
import { createButton, type ButtonHandle } from "./button.ts";

const GLYPHS = "▓▒░█#@%&*+".split("");

type FragmentView = {
  row: HTMLElement;
  valueEl: HTMLElement;
  actionBtn: ButtonHandle;
  lastStage: number;
  lastCorrupted: boolean;
  lastResolved: boolean;
  lastCost: number;
  lastAffordable: boolean;
  lostAnimating: boolean;
};

type ContainerView = {
  card: HTMLElement;
  body: HTMLElement;
  extractBtn: ButtonHandle;
  fragments: Map<number, FragmentView>;
  lastReady: boolean | null;
};

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

  const slotOwners: (Container | null)[] = Array.from({ length: SLOT_COUNT }, () => null);
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
        if (view.root.children[i] !== cv.card) view.root.insertBefore(cv.card, view.root.children[i] ?? null);
        placeholder.remove();
      } else {
        if (view.root.children[i] !== placeholder) view.root.insertBefore(placeholder, view.root.children[i] ?? null);
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

function createContainerView(
  container: Container,
  state: GameState,
  onMutate: () => void,
): ContainerView {
  const card = document.createElement("article");
  card.className = `container-card rarity-${container.rarity ?? "common"}`;
  const title = document.createElement("h3");
  title.textContent = `Receipt #${container.id}`;
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
  card.append(title, body, extractBtn.el);
  return { card, body, extractBtn, fragments: new Map(), lastReady: null };
}

function syncContainer(
  cv: ContainerView,
  container: Container,
  state: GameState,
  onMutate: () => void,
): void {
  const liveIds = new Set<number>();
  for (const fragment of container.fragments) {
    const existing = cv.fragments.get(fragment.id);
    if (fragment.resolved && fragment.corrupted && existing && !existing.lostAnimating) {
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
      label: ready ? "Extract" : "Revealing…",
      disabled: !ready,
      dim: !ready,
    });
    cv.card.classList.toggle("is-ready", ready);
    cv.lastReady = ready;
  }
}

function createFragmentView(
  fragment: Fragment,
  state: GameState,
  onMutate: () => void,
): FragmentView {
  const row = document.createElement("div");
  row.className = "fragment-row";

  const label = document.createElement("span");
  label.className = "fragment-label";
  label.textContent = fragment.label;

  const valueEl = document.createElement("span");
  valueEl.className = "fragment-value";

  const actionBtn = createButton({
    variant: "inline",
    label: "Reveal",
    onClick: () => {
      if (fragment.corrupted) {
        if (restoreCorrupted(state, fragment.id)) onMutate();
      } else if (advanceReveal(state, fragment.id)) onMutate();
    },
  });

  row.append(label, valueEl, actionBtn.el);

  return {
    row,
    valueEl,
    actionBtn,
    lastStage: -1,
    lastCorrupted: !fragment.corrupted,
    lastResolved: !fragment.resolved,
    lastCost: -1,
    lastAffordable: false,
    lostAnimating: false,
  };
}

function syncFragment(
  fv: FragmentView,
  fragment: Fragment,
  state: GameState,
): void {
  const nextCost =
    fragment.corrupted
      ? REVEAL.corruptionRestoreCost
      : fragment.stage < 3
        ? revealStageCost(state, fragment.stage as 0 | 1 | 2)
        : -1;
  const affordable = nextCost >= 0 && state.compute >= nextCost;
  if (
    fv.lastStage === fragment.stage &&
    fv.lastCorrupted === fragment.corrupted &&
    fv.lastCost === nextCost &&
    fv.lastAffordable === affordable
  ) {
    return;
  }
  const visualDirty =
    fv.lastStage !== fragment.stage || fv.lastCorrupted !== fragment.corrupted;
  if (visualDirty) fv.valueEl.textContent = obscure(fragment);
  fv.lastStage = fragment.stage;
  fv.lastCorrupted = fragment.corrupted;
  fv.lastCost = nextCost;
  fv.lastAffordable = affordable;

  if (fragment.corrupted) {
    fv.actionBtn.update({
      hidden: false,
      disabled: !affordable,
      dim: !affordable,
      label: "Restore",
      cost: { amount: REVEAL.corruptionRestoreCost, unit: "c" },
    });
  } else if (fragment.stage < 3 && nextCost > 1) {
    fv.actionBtn.update({
      hidden: false,
      disabled: !affordable,
      dim: !affordable,
      label: "Reveal",
      cost: { amount: nextCost, unit: "c" },
    });
  } else {
    fv.actionBtn.update({ hidden: true });
  }
}

function obscure(fragment: Fragment): string {
  if (fragment.corrupted) return "░░ corrupted ░░";
  const visibleChars =
    fragment.stage >= 3
      ? fragment.value.length
      : Math.ceil((fragment.stage / 3) * fragment.value.length);
  let out = "";
  for (let i = 0; i < fragment.value.length; i++) {
    if (i < visibleChars) {
      out += fragment.value[i];
    } else {
      const ch = fragment.value[i];
      if (ch === " ") out += " ";
      else out += GLYPHS[(fragment.id + i) % GLYPHS.length];
    }
  }
  return out;
}
