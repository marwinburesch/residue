import { REVEAL } from "../data/tuning.ts";
import type { Fragment, GameState } from "../engine/state.ts";
import {
  advanceReveal,
  discardFragment,
  restoreCorrupted,
} from "../engine/fragments.ts";

const GLYPHS = "▓▒░█#@%&*+".split("");

export function renderFragmentBrowser(
  root: HTMLElement,
  state: GameState,
  onMutate: () => void,
): void {
  if (state.containers.length === 0) {
    root.innerHTML = `<p class="empty">Awaiting source material…</p>`;
    return;
  }
  root.innerHTML = "";
  for (const container of state.containers) {
    const card = document.createElement("article");
    card.className = "container-card";
    card.innerHTML = `<h3>Receipt #${container.id}</h3>`;
    for (const fragment of container.fragments) {
      if (fragment.resolved) continue;
      card.appendChild(renderFragment(state, fragment, onMutate));
    }
    root.appendChild(card);
  }
}

function renderFragment(
  state: GameState,
  fragment: Fragment,
  onMutate: () => void,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "fragment-row";
  const label = document.createElement("span");
  label.className = "fragment-label";
  label.textContent = fragment.label;

  const value = document.createElement("span");
  value.className = "fragment-value";
  value.textContent = obscure(fragment);

  const action = document.createElement("button");
  action.className = "fragment-action";

  if (fragment.corrupted) {
    action.textContent = `Restore (${REVEAL.corruptionRestoreCost}c)`;
    action.addEventListener("click", () => {
      if (restoreCorrupted(state, fragment.id)) onMutate();
    });
    const discard = document.createElement("button");
    discard.className = "fragment-action fragment-action--secondary";
    discard.textContent = "Discard";
    discard.addEventListener("click", () => {
      if (discardFragment(state, fragment.id)) onMutate();
    });
    row.append(label, value, action, discard);
    return row;
  }

  const cost =
    (REVEAL.costPerManualStage as readonly number[])[fragment.stage] ?? 0;
  if (fragment.stage < 3) {
    action.textContent = `Reveal (${cost}c)`;
    action.addEventListener("click", () => {
      if (advanceReveal(state, fragment.id)) onMutate();
    });
  } else {
    action.textContent = "Extracting…";
    action.disabled = true;
  }

  row.append(label, value, action);
  return row;
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
