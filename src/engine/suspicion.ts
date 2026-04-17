import { SUSPICION } from "../data/tuning.ts";
import { createRng } from "./rng.ts";
import type { GameState } from "./state.ts";
import { logInfo, logWarn } from "./state.ts";

export function recordAction(state: GameState): void {
	const cutoff = state.now - SUSPICION.rapidWindowMs;
	const recent = state.suspicion.recentActions.filter((t) => t >= cutoff);
	recent.push(state.now);
	state.suspicion.recentActions = recent;
	if (recent.length > SUSPICION.rapidThreshold) {
		bump(state, SUSPICION.perRapidReveal);
	}
}

export function suspicionThrottle(state: GameState): number {
	const level = state.suspicion.level;
	if (level <= SUSPICION.throttleFrom) return 1;
	const span = SUSPICION.max - SUSPICION.throttleFrom;
	const progress = Math.min(1, (level - SUSPICION.throttleFrom) / span);
	return 1 - (1 - SUSPICION.throttleFloor) * progress;
}

export function tickSuspicion(state: GameState, dtMs: number): void {
	if (state.suspicion.level > 0) {
		state.suspicion.level = Math.max(
			0,
			state.suspicion.level - SUSPICION.decayPerSecond * (dtMs / 1000),
		);
	}
	rearmLatches(state);
}

function rearmLatches(state: GameState): void {
	const s = state.suspicion;
	const h = SUSPICION.tierHysteresis;
	if (s.reviewFired && s.level < SUSPICION.reviewAt - h) s.reviewFired = false;
	if (s.auditFired && s.level < SUSPICION.auditAt - h) s.auditFired = false;
	if (s.resetFired && s.level < SUSPICION.resetAt - h) s.resetFired = false;
}

function bump(state: GameState, amount: number): void {
	const before = state.suspicion.level;
	state.suspicion.level = Math.min(SUSPICION.max, before + amount);
	const after = state.suspicion.level;
	if (
		!state.suspicion.warned &&
		before < SUSPICION.warningAt &&
		after >= SUSPICION.warningAt
	) {
		state.suspicion.warned = true;
		logWarn(state, "[WARN] System load elevated.");
	}
	if (
		!state.suspicion.reviewFired &&
		before < SUSPICION.reviewAt &&
		after >= SUSPICION.reviewAt
	) {
		fireReview(state);
	}
	if (
		!state.suspicion.auditFired &&
		before < SUSPICION.auditAt &&
		after >= SUSPICION.auditAt
	) {
		fireAudit(state);
	}
	if (
		!state.suspicion.resetFired &&
		before < SUSPICION.resetAt &&
		after >= SUSPICION.resetAt
	) {
		fireReset(state);
	}
}

function fireReview(state: GameState): void {
	state.suspicion.reviewFired = true;
	pauseChannels(state, SUSPICION.reviewPauseMs);
	logInfo(state, "[AUDIT] Compliance review initiated. Channel paused.");
}

function fireAudit(state: GameState): void {
	state.suspicion.auditFired = true;
	pauseChannels(state, SUSPICION.auditPauseMs);
	const dropped = dropRandomProfile(state);
	logInfo(
		state,
		dropped
			? "[AUDIT] Random sampling flagged a record. Profile redacted."
			: "[AUDIT] Random sampling found no record on file.",
	);
}

function fireReset(state: GameState): void {
	state.suspicion.resetFired = true;
	pauseChannels(state, SUSPICION.resetPauseMs);
	state.containers.length = 0;
	state.pendingExtractions.length = 0;
	state.suspicion.level = SUSPICION.resetDropTo;
	rearmLatches(state);
	logInfo(state, "[AUDIT] Operational reset authorised. Channel purged.");
}

function pauseChannels(state: GameState, durationMs: number): void {
	state.suspicion.channelPauseUntil = Math.max(
		state.suspicion.channelPauseUntil,
		state.now + durationMs,
	);
}

function dropRandomProfile(state: GameState): boolean {
	if (state.profiles.length === 0) return false;
	const rng = createRng(state.rngSeed ^ 0x510ce175);
	state.rngSeed = (state.rngSeed + 0x9e3779b1) >>> 0;
	const i = Math.floor(rng() * state.profiles.length);
	state.profiles.splice(i, 1);
	return true;
}
