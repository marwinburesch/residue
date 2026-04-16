import type { ButtonPatch } from "./button.ts";

export function costButton(cost: number, resource: number): ButtonPatch {
	const affordable = resource >= cost;
	return {
		hidden: false,
		disabled: !affordable,
		dim: !affordable,
		cost: { amount: cost, unit: "c" },
	};
}
