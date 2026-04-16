import type { GameState, Profile } from "../engine/state.ts";

type Entry = { el: HTMLElement; sig: string };

type View = {
	header: HTMLElement;
	list: HTMLUListElement | null;
	empty: HTMLElement | null;
	entries: Map<number, Entry>;
	lastCount: number;
};

const views = new WeakMap<HTMLElement, View>();

export function renderProfileRegistry(
	root: HTMLElement,
	state: GameState,
): void {
	const view = views.get(root) ?? initView(root);
	const count = state.profiles.length;

	if (count === 0) {
		if (view.list) {
			view.list.remove();
			view.list = null;
			view.entries.clear();
		}
		if (!view.empty) {
			const p = document.createElement("p");
			p.className = "empty";
			p.textContent = "No entities resolved yet.";
			root.appendChild(p);
			view.empty = p;
		}
		if (view.lastCount !== 0) {
			view.header.textContent = "Registry";
			view.lastCount = 0;
		}
		return;
	}

	if (view.empty) {
		view.empty.remove();
		view.empty = null;
	}
	if (!view.list) {
		const list = document.createElement("ul");
		list.className = "profile-list";
		root.appendChild(list);
		view.list = list;
	}
	if (count !== view.lastCount) {
		view.header.textContent = `Registry (${count})`;
		view.lastCount = count;
	}

	const sorted = [...state.profiles].sort((a, b) => b.createdAt - a.createdAt);
	const liveIds = new Set<number>();

	let anchor: Node | null = view.list.firstChild;
	for (const profile of sorted) {
		liveIds.add(profile.id);
		const sig = profileSig(profile);
		let entry = view.entries.get(profile.id);
		if (!entry) {
			entry = { el: createProfileEl(profile), sig };
			view.entries.set(profile.id, entry);
		} else if (entry.sig !== sig) {
			updateProfileEl(entry.el, profile);
			entry.sig = sig;
		}
		if (anchor === entry.el) {
			anchor = entry.el.nextSibling;
		} else {
			view.list.insertBefore(entry.el, anchor);
		}
	}

	for (const [id, entry] of view.entries) {
		if (!liveIds.has(id)) {
			entry.el.remove();
			view.entries.delete(id);
		}
	}
}

function initView(root: HTMLElement): View {
	root.innerHTML = "";
	const header = document.createElement("h2");
	header.textContent = "Registry";
	root.appendChild(header);
	const view: View = {
		header,
		list: null,
		empty: null,
		entries: new Map(),
		lastCount: -1,
	};
	views.set(root, view);
	return view;
}

function profileSig(profile: Profile): string {
	const keys = Object.keys(profile.fields).sort().join(",");
	return `${profile.tier}|${keys}`;
}

function createProfileEl(profile: Profile): HTMLElement {
	const li = document.createElement("li");
	updateProfileEl(li, profile);
	return li;
}

function updateProfileEl(li: HTMLElement, profile: Profile): void {
	li.className = `profile profile--${profile.tier}`;
	li.replaceChildren();
	const header = document.createElement("header");
	header.innerHTML = `
    <span class="profile-id">#${profile.id}</span>
    <span class="profile-tier">${profile.tier}</span>
  `;
	li.appendChild(header);
	const fields = document.createElement("dl");
	for (const [kind, value] of Object.entries(profile.fields)) {
		const dt = document.createElement("dt");
		dt.textContent = kind;
		const dd = document.createElement("dd");
		dd.textContent = value ?? "—";
		fields.append(dt, dd);
	}
	li.appendChild(fields);
}
