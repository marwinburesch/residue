export type ButtonVariant = "block" | "inline" | "icon";

export interface ButtonCost {
	amount: number;
	unit: string;
}

export interface ButtonOptions {
	variant?: ButtonVariant;
	label: string;
	icon?: string;
	cost?: ButtonCost | null;
	dim?: boolean;
	onClick: () => void;
}

export interface ButtonPatch {
	label?: string;
	icon?: string;
	cost?: ButtonCost | null;
	dim?: boolean;
	disabled?: boolean;
	hidden?: boolean;
}

export interface ButtonHandle {
	el: HTMLButtonElement;
	update(patch: ButtonPatch): void;
}

export function createButton(opts: ButtonOptions): ButtonHandle {
	const variant: ButtonVariant = opts.variant ?? "block";
	const el = document.createElement("button");
	el.type = "button";
	el.className = `btn btn--${variant}`;
	el.addEventListener("click", opts.onClick);

	const state = {
		variant,
		label: opts.label,
		icon: opts.icon ?? "",
		cost: opts.cost ?? null,
		dim: opts.dim ?? false,
		disabled: false,
		hidden: false,
	};

	const iconEl = state.icon ? document.createElement("span") : null;
	if (iconEl) {
		iconEl.className = "icon";
		iconEl.innerHTML = state.icon;
		el.appendChild(iconEl);
	}
	const textEl = document.createElement("span");
	textEl.className = "btn-text";
	textEl.textContent = renderText(state.variant, state.label, state.cost);
	el.appendChild(textEl);

	if (state.variant === "icon") el.setAttribute("aria-label", state.label);
	if (state.dim) el.classList.add("btn--dim");

	function update(patch: ButtonPatch): void {
		let textDirty = false;
		if (patch.label !== undefined && patch.label !== state.label) {
			state.label = patch.label;
			textDirty = true;
		}
		if (patch.cost !== undefined && !sameCost(patch.cost, state.cost)) {
			state.cost = patch.cost;
			textDirty = true;
		}
		if (textDirty) {
			textEl.textContent = renderText(state.variant, state.label, state.cost);
			if (state.variant === "icon") el.setAttribute("aria-label", state.label);
		}
		if (patch.icon !== undefined && patch.icon !== state.icon && iconEl) {
			state.icon = patch.icon;
			iconEl.innerHTML = state.icon;
		}
		if (patch.dim !== undefined && patch.dim !== state.dim) {
			state.dim = patch.dim;
			el.classList.toggle("btn--dim", state.dim);
		}
		if (patch.disabled !== undefined && patch.disabled !== state.disabled) {
			state.disabled = patch.disabled;
			el.disabled = state.disabled;
		}
		if (patch.hidden !== undefined && patch.hidden !== state.hidden) {
			state.hidden = patch.hidden;
			el.hidden = state.hidden;
		}
	}

	return { el, update };
}

function renderText(
	variant: ButtonVariant,
	label: string,
	cost: ButtonCost | null,
): string {
	if (variant === "icon") return cost ? String(cost.amount) : label;
	if (!cost) return label;
	if (variant === "block") return `${label} · ${cost.amount} ${cost.unit}`;
	return `${label} (${cost.amount}${cost.unit})`;
}

function sameCost(a: ButtonCost | null, b: ButtonCost | null): boolean {
	if (a === b) return true;
	if (!a || !b) return false;
	return a.amount === b.amount && a.unit === b.unit;
}
