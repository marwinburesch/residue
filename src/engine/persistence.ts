import { DP, OFFLINE } from "../data/tuning.ts";
import type { GameState } from "./state.ts";
import { logInfo } from "./state.ts";

export type SaveBlob = GameState;

export function serialize(state: GameState, now: number): string {
	state.lastSavedAt = now;
	return JSON.stringify(state);
}

export function deserialize(raw: string): GameState | null {
	try {
		const parsed = JSON.parse(raw) as Partial<GameState>;
		if (parsed && parsed.version === 1) {
			const s = parsed as GameState;
			s.pendingExtractions ??= [];
			s.upgrades ??= {};
			s.autoExtractTimer ??= 0;
			s.autoRestoreTimer ??= 0;
			s.milestonesFired ??= [];
			s.stage ??= 0;
			return s;
		}
		return null;
	} catch {
		return null;
	}
}

export type OfflineReport = {
	elapsedMs: number;
	awardedDp: number;
	capped: boolean;
};

export function reconcileOffline(
	state: GameState,
	now: number,
): OfflineReport | null {
	const rawElapsed = now - state.lastSavedAt;
	if (rawElapsed < OFFLINE.minIdleMs) {
		state.lastSavedAt = Math.max(state.lastSavedAt, now);
		state.now = Math.max(state.now, now);
		return null;
	}
	const capped = rawElapsed > OFFLINE.capMs;
	const elapsed = Math.max(0, Math.min(rawElapsed, OFFLINE.capMs));

	const fields = state.profiles.reduce(
		(acc, p) => acc + Object.keys(p.fields).length,
		0,
	);
	const outlineFields = state.profiles
		.filter((p) => p.tier === "outline")
		.reduce((acc, p) => acc + Object.keys(p.fields).length, 0);
	const ghostFields = fields - outlineFields;

	const perSecond =
		ghostFields * DP.perFieldPerSecondGhost +
		outlineFields * DP.perFieldPerSecondOutline;
	const awarded = perSecond * (elapsed / 1000) * OFFLINE.rate;

	if (awarded > 0) {
		state.dp += awarded;
		state.totalDpEarned += awarded;
	}
	state.lastSavedAt = now;
	state.now = now;
	logInfo(
		state,
		`[INFO] Batch reconciliation complete. ${Math.round(awarded)} DP recovered.`,
	);
	return { elapsedMs: elapsed, awardedDp: awarded, capped };
}
