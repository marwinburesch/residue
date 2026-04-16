import type { GameState, LogEntry } from "../engine/state.ts";

type View = {
	list: HTMLOListElement;
	lastTail: LogEntry | null;
};

const views = new WeakMap<HTMLElement, View>();

export function renderLog(root: HTMLElement, state: GameState): void {
	const tail = state.log[state.log.length - 1] ?? null;
	const view = views.get(root) ?? initView(root);
	if (tail === view.lastTail) return;
	view.lastTail = tail;
	const recent = state.log.slice(-30);
	view.list.replaceChildren();
	for (const entry of recent) {
		const li = document.createElement("li");
		li.className = `log-entry log-entry--${entry.kind}`;
		li.textContent = entry.text;
		view.list.appendChild(li);
	}
	root.scrollTop = root.scrollHeight;
}

function initView(root: HTMLElement): View {
	root.replaceChildren();
	const list = document.createElement("ol");
	list.className = "log-list";
	root.appendChild(list);
	const view: View = { list, lastTail: null };
	views.set(root, view);
	return view;
}
