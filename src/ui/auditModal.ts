import type { GameState } from "../engine/state.ts";

let modalEl: HTMLElement | null = null;
let lastActive: boolean | null = null;

export function renderAuditModal(state: GameState): void {
	const active = state.now < state.suspicion.channelPauseUntil;
	if (!modalEl) modalEl = mount();
	if (active === lastActive) return;
	lastActive = active;
	modalEl.classList.toggle("audit-modal--active", active);
	modalEl.setAttribute("aria-hidden", active ? "false" : "true");
}

function mount(): HTMLElement {
	const el = document.createElement("div");
	el.className = "audit-modal";
	el.setAttribute("role", "status");
	el.setAttribute("aria-live", "polite");
	el.setAttribute("aria-hidden", "true");
	el.innerHTML = `<div class="audit-modal__frame">AUDIT IN PROGRESS…</div>`;
	document.body.appendChild(el);
	return el;
}
