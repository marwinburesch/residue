import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import { awardDp, regenCompute, spendCompute } from "./resources.ts";
import { COMPUTE } from "../data/tuning.ts";
import { COMPUTE_MAX_BASE } from "../data/upgradeTree.ts";

describe("compute", () => {
	test("regens at the configured rate", () => {
		const s = createState(1, 0);
		s.compute = 0;
		regenCompute(s, 1000);
		expect(s.compute).toBeCloseTo(COMPUTE.regenPerSecond, 5);
	});

	test("regen is capped at max", () => {
		const s = createState(1, 0);
		s.compute = COMPUTE_MAX_BASE - 0.01;
		regenCompute(s, 10_000);
		expect(s.compute).toBe(COMPUTE_MAX_BASE);
	});

	test("spend returns false when insufficient and does not deduct", () => {
		const s = createState(1, 0);
		s.compute = 2;
		expect(spendCompute(s, 5)).toBe(false);
		expect(s.compute).toBe(2);
	});

	test("spend deducts when affordable", () => {
		const s = createState(1, 0);
		s.compute = 5;
		expect(spendCompute(s, 3)).toBe(true);
		expect(s.compute).toBe(2);
	});
});

describe("dp", () => {
	test("awardDp accumulates and tracks total earned", () => {
		const s = createState(1, 0);
		awardDp(s, 10);
		awardDp(s, 5);
		expect(s.dp).toBe(15);
		expect(s.totalDpEarned).toBe(15);
	});

	test("awardDp ignores non-positive values", () => {
		const s = createState(1, 0);
		awardDp(s, -1);
		awardDp(s, 0);
		expect(s.dp).toBe(0);
	});
});
