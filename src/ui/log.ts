import type { GameState } from "../engine/state.ts";

export function renderLog(root: HTMLElement, state: GameState): void {
  const recent = state.log.slice(-30).reverse();
  root.innerHTML = `<h2>Log</h2>`;
  const list = document.createElement("ol");
  list.className = "log-list";
  for (const entry of recent) {
    const li = document.createElement("li");
    li.className = `log-entry log-entry--${entry.kind}`;
    li.textContent = entry.text;
    list.appendChild(li);
  }
  root.appendChild(list);
}
