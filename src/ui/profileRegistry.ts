import type { GameState, Profile } from "../engine/state.ts";

export function renderProfileRegistry(
	root: HTMLElement,
	state: GameState,
): void {
	if (state.profiles.length === 0) {
		root.innerHTML = `
      <h2>Registry</h2>
      <p class="empty">No entities resolved yet.</p>
    `;
		return;
	}
	const sorted = [...state.profiles].sort((a, b) => b.createdAt - a.createdAt);
	root.innerHTML = `<h2>Registry (${state.profiles.length})</h2>`;
	const list = document.createElement("ul");
	list.className = "profile-list";
	for (const profile of sorted) list.appendChild(renderProfile(profile));
	root.appendChild(list);
}

function renderProfile(profile: Profile): HTMLElement {
	const li = document.createElement("li");
	li.className = `profile profile--${profile.tier}`;
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
	return li;
}
