import {
	deserialize,
	reconcileOffline,
	serialize,
	type OfflineReport,
} from "../engine/persistence.ts";
import { createState, type GameState } from "../engine/state.ts";

export const SAVE_KEY = "residue:save";

export function loadOrInit(now: number): {
	state: GameState;
	offline: OfflineReport | null;
} {
	const raw = readSafely();
	if (!raw) {
		const seed = Math.floor(Math.random() * 2 ** 31);
		return { state: createState(seed, now), offline: null };
	}
	const parsed = deserialize(raw);
	if (!parsed) {
		const seed = Math.floor(Math.random() * 2 ** 31);
		return { state: createState(seed, now), offline: null };
	}
	const offline = reconcileOffline(parsed, now);
	return { state: parsed, offline };
}

export function save(state: GameState, now: number): void {
	try {
		localStorage.setItem(SAVE_KEY, serialize(state, now));
	} catch {
		// quota or denied storage; ignore for the slice
	}
}

export function wipe(): void {
	try {
		localStorage.removeItem(SAVE_KEY);
	} catch {
		// ignore
	}
}

function readSafely(): string | null {
	try {
		return localStorage.getItem(SAVE_KEY);
	} catch {
		return null;
	}
}
