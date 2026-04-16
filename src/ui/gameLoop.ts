import { TICK_MS } from "../data/tuning.ts";
import { step } from "../engine/tick.ts";
import type { GameState } from "../engine/state.ts";
import { save } from "./storage.ts";

const AUTOSAVE_MS = 5_000;

export type GameLoop = {
	markWiped: () => void;
};

export function startGameLoop(state: GameState): GameLoop {
	let wiped = false;
	let lastTick = performance.now();
	let lastSave = Date.now();

	setInterval(() => {
		const now = performance.now();
		const dt = now - lastTick;
		lastTick = now;
		step(state, dt);
		const realNow = Date.now();
		if (!wiped && realNow - lastSave >= AUTOSAVE_MS) {
			save(state, realNow);
			lastSave = realNow;
		}
	}, TICK_MS);

	document.addEventListener("visibilitychange", () => {
		if (!wiped && document.visibilityState === "hidden")
			save(state, Date.now());
	});
	window.addEventListener("beforeunload", () => {
		if (!wiped) save(state, Date.now());
	});

	return {
		markWiped: () => {
			wiped = true;
		},
	};
}
