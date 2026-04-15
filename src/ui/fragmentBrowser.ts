import { REVEAL } from "../data/tuning.ts";
import type { Container, Fragment, GameState } from "../engine/state.ts";
import {
  advanceReveal,
  extractContainer,
  isContainerReady,
  restoreCorrupted,
} from "../engine/fragments.ts";

const GLYPHS = "▓▒░█#@%&*+".split("");

type FragmentView = {
  row: HTMLElement;
  valueEl: HTMLElement;
  actionBtn: HTMLButtonElement;
  lastStage: number;
  lastCorrupted: boolean;
  lastResolved: boolean;
};

type ContainerView = {
  card: HTMLElement;
  body: HTMLElement;
  extractBtn: HTMLButtonElement;
  fragments: Map<number, FragmentView>;
  lastReady: boolean;
};

type BrowserView = {
  root: HTMLElement;
  empty: HTMLElement;
  containers: Map<number, ContainerView>;
};

const views = new WeakMap<HTMLElement, BrowserView>();

export function renderFragmentBrowser(
  root: HTMLElement,
  state: GameState,
  onMutate: () => void,
): void {
  const view = views.get(root) ?? initView(root);
  const containerIds = new Set<number>();

  for (const container of state.containers) {
    containerIds.add(container.id);
    let cv = view.containers.get(container.id);
    if (!cv) {
      cv = createContainerView(container, state, onMutate);
      view.containers.set(container.id, cv);
      view.root.appendChild(cv.card);
    }
    syncContainer(cv, container, state, onMutate);
  }

  for (const [id, cv] of view.containers) {
    if (!containerIds.has(id)) {
      cv.card.remove();
      view.containers.delete(id);
    }
  }

  view.empty.hidden = state.containers.length > 0;
}

function initView(root: HTMLElement): BrowserView {
  root.innerHTML = "";
  const empty = document.createElement("p");
  empty.className = "empty";
  empty.textContent = "Awaiting source material…";
  root.appendChild(empty);
  const view: BrowserView = { root, empty, containers: new Map() };
  views.set(root, view);
  return view;
}

function createContainerView(
  container: Container,
  state: GameState,
  onMutate: () => void,
): ContainerView {
  const card = document.createElement("article");
  card.className = "container-card";
  const title = document.createElement("h3");
  title.textContent = `Receipt #${container.id}`;
  const body = document.createElement("div");
  body.className = "container-body";
  const extractBtn = document.createElement("button");
  extractBtn.type = "button";
  extractBtn.className = "container-extract";
  extractBtn.textContent = "Extract";
  extractBtn.addEventListener("click", () => {
    if (extractContainer(state, container.id)) onMutate();
  });
  card.append(title, body, extractBtn);
  return { card, body, extractBtn, fragments: new Map(), lastReady: false };
}

function syncContainer(
  cv: ContainerView,
  container: Container,
  state: GameState,
  onMutate: () => void,
): void {
  const liveIds = new Set<number>();
  for (const fragment of container.fragments) {
    if (fragment.resolved) continue;
    liveIds.add(fragment.id);
    let fv = cv.fragments.get(fragment.id);
    if (!fv) {
      fv = createFragmentView(fragment, state, onMutate);
      cv.fragments.set(fragment.id, fv);
      cv.body.appendChild(fv.row);
    }
    syncFragment(fv, fragment);
  }
  for (const [id, fv] of cv.fragments) {
    if (!liveIds.has(id)) {
      fv.row.remove();
      cv.fragments.delete(id);
    }
  }
  const ready = isContainerReady(container);
  if (ready !== cv.lastReady) {
    cv.extractBtn.disabled = !ready;
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

  const actionBtn = document.createElement("button");
  actionBtn.type = "button";
  actionBtn.className = "fragment-action";
  actionBtn.addEventListener("click", () => {
    if (fragment.corrupted) {
      if (restoreCorrupted(state, fragment.id)) onMutate();
    } else if (advanceReveal(state, fragment.id)) onMutate();
  });

  row.append(label, valueEl, actionBtn);

  return {
    row,
    valueEl,
    actionBtn,
    lastStage: -1,
    lastCorrupted: !fragment.corrupted,
    lastResolved: !fragment.resolved,
  };
}

function syncFragment(fv: FragmentView, fragment: Fragment): void {
  if (
    fv.lastStage !== fragment.stage ||
    fv.lastCorrupted !== fragment.corrupted
  ) {
    fv.valueEl.textContent = obscure(fragment);
    fv.lastStage = fragment.stage;
    fv.lastCorrupted = fragment.corrupted;

    if (fragment.corrupted) {
      fv.actionBtn.hidden = false;
      fv.actionBtn.disabled = false;
      fv.actionBtn.textContent = `Restore (${REVEAL.corruptionRestoreCost}c)`;
    } else if (fragment.stage < 3) {
      const cost =
        (REVEAL.costPerManualStage as readonly number[])[fragment.stage] ?? 0;
      fv.actionBtn.hidden = false;
      fv.actionBtn.disabled = false;
      fv.actionBtn.textContent = `Reveal (${cost}c)`;
    } else {
      fv.actionBtn.hidden = true;
    }
  }
}

function obscure(fragment: Fragment): string {
  if (fragment.corrupted) return "░░ corrupted ░░";
  const visibleChars = Math.floor((fragment.stage / 3) * fragment.value.length);
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
