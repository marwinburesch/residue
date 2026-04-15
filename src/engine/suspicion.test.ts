import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import { recordAction, tickSuspicion } from "./suspicion.ts";
import { SUSPICION } from "../data/tuning.ts";

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
		expect(s.suspicion.level).toBe(10 - SUSPICION.decayPerSecond * 10);
	});

	test("does not decay below zero", () => {
		const s = createState(1, 0);
		s.suspicion.level = 0.1;
		tickSuspicion(s, 10_000);
		expect(s.suspicion.level).toBe(0);
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
