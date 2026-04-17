import { describe, expect, test } from "bun:test";
import { createState, type GameState } from "./state.ts";
import { recordAction, suspicionThrottle, tickSuspicion } from "./suspicion.ts";
import { SUSPICION } from "../data/tuning.ts";
import { complianceHygieneDecayFor } from "../data/upgradeTree.ts";

function recordBurst(s: GameState, count: number): void {
	for (let i = 0; i < count; i++) {
		s.now += 10;
		recordAction(s);
	}
}

describe("suspicion", () => {
	test("rapid actions within the window raise the meter", () => {
		const s = createState(1, 0);
		for (let i = 0; i < SUSPICION.rapidThreshold + 2; i++) {
			s.now = i * 10;
			recordAction(s);
		}
		expect(s.suspicion.level).toBeGreaterThan(0);
	});

	test("spaced actions outside the window do not raise the meter", () => {
		const s = createState(1, 0);
		for (let i = 0; i < 5; i++) {
			s.now = i * (SUSPICION.rapidWindowMs + 10);
			recordAction(s);
		}
		expect(s.suspicion.level).toBe(0);
	});

	test("decays over time", () => {
		const s = createState(1, 0);
		s.suspicion.level = 10;
		tickSuspicion(s, 10_000);
		expect(s.suspicion.level).toBe(10 - complianceHygieneDecayFor(0) * 10);
	});

	test("compliance hygiene upgrade accelerates decay", () => {
		const s = createState(1, 0);
		s.suspicion.level = 50;
		s.upgrades.complianceHygiene = 3;
		tickSuspicion(s, 10_000);
		expect(s.suspicion.level).toBe(50 - complianceHygieneDecayFor(3) * 10);
	});

	test("does not decay below zero", () => {
		const s = createState(1, 0);
		s.suspicion.level = 0.1;
		tickSuspicion(s, 10_000);
		expect(s.suspicion.level).toBe(0);
	});

	test("throttle is 1 below threshold and reaches floor at max", () => {
		const s = createState(1, 0);
		s.suspicion.level = SUSPICION.throttleFrom;
		expect(suspicionThrottle(s)).toBe(1);
		s.suspicion.level = SUSPICION.max;
		expect(suspicionThrottle(s)).toBeCloseTo(SUSPICION.throttleFloor, 5);
		s.suspicion.level = (SUSPICION.throttleFrom + SUSPICION.max) / 2;
		const mid = suspicionThrottle(s);
		expect(mid).toBeLessThan(1);
		expect(mid).toBeGreaterThan(SUSPICION.throttleFloor);
	});

	test("crossing the warning threshold logs once", () => {
		const s = createState(1, 0);
		s.suspicion.level = SUSPICION.warningAt - 0.1;
		for (let i = 0; i < SUSPICION.rapidThreshold + 5; i++) {
			s.now = i * 10;
			recordAction(s);
		}
		const warnings = s.log.filter((l) => l.kind === "warn");
		expect(warnings.length).toBe(1);
	});
});

describe("suspicion consequences", () => {
	test("crossing 50 fires a compliance review and pauses channels", () => {
		const s = createState(1, 0);
		s.suspicion.level = SUSPICION.reviewAt - 1;
		recordBurst(s, SUSPICION.rapidThreshold + 1);
		expect(s.suspicion.reviewFired).toBe(true);
		expect(s.suspicion.channelPauseUntil).toBe(s.now + SUSPICION.reviewPauseMs);
		expect(
			s.log.some((l) => l.text.startsWith("[AUDIT] Compliance review")),
		).toBe(true);
	});

	test("crossing 75 fires an audit and drops a random profile", () => {
		const s = createState(1, 0);
		s.suspicion.reviewFired = true;
		s.suspicion.level = SUSPICION.auditAt - 1;
		s.profiles = [
			{ id: 1, createdAt: 0, fields: {}, sources: [], tier: "ghost" },
			{ id: 2, createdAt: 0, fields: {}, sources: [], tier: "ghost" },
		];
		recordBurst(s, SUSPICION.rapidThreshold + 1);
		expect(s.suspicion.auditFired).toBe(true);
		expect(s.profiles.length).toBe(1);
		expect(
			s.log.some((l) => l.text.startsWith("[AUDIT] Random sampling flagged")),
		).toBe(true);
	});

	test("audit logs a dry line when there is nothing to sample", () => {
		const s = createState(1, 0);
		s.suspicion.reviewFired = true;
		s.suspicion.level = SUSPICION.auditAt - 1;
		recordBurst(s, SUSPICION.rapidThreshold + 1);
		expect(s.suspicion.auditFired).toBe(true);
		expect(s.profiles.length).toBe(0);
		expect(
			s.log.some((l) =>
				l.text.startsWith("[AUDIT] Random sampling found no record"),
			),
		).toBe(true);
	});

	test("crossing 100 purges containers and pending, and drops suspicion to the reset level", () => {
		const s = createState(1, 0);
		s.suspicion.reviewFired = true;
		s.suspicion.auditFired = true;
		s.suspicion.level = SUSPICION.resetAt - 1;
		s.containers = [
			{
				id: 9,
				channel: "receipts",
				spawnedAt: 0,
				rarity: "common",
				fragments: [],
			},
		];
		s.pendingExtractions = [[]];
		recordBurst(s, SUSPICION.rapidThreshold + 1);
		expect(s.suspicion.level).toBe(SUSPICION.resetDropTo);
		expect(s.containers.length).toBe(0);
		expect(s.pendingExtractions.length).toBe(0);
		expect(
			s.log.some((l) => l.text.startsWith("[AUDIT] Operational reset")),
		).toBe(true);
	});

	test("latches re-arm once suspicion decays below the hysteresis band", () => {
		const s = createState(1, 0);
		s.suspicion.level = SUSPICION.reviewAt - 1;
		recordBurst(s, SUSPICION.rapidThreshold + 1);
		expect(s.suspicion.reviewFired).toBe(true);
		s.suspicion.level = SUSPICION.reviewAt - SUSPICION.tierHysteresis - 0.5;
		tickSuspicion(s, 0);
		expect(s.suspicion.reviewFired).toBe(false);
	});
});
