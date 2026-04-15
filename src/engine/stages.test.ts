import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import {
	advanceStageIfReady,
	canAdvance,
	outlineProfileCount,
} from "./stages.ts";

function stateWithOutlines(count: number) {
	const s = createState(1, 0);
	for (let i = 0; i < count; i++) {
		s.profiles.push({
			id: i,
			createdAt: 0,
			fields: { name: `p${i}`, email: "e", postcode: "z" },
			sources: ["receipts"],
			tier: "outline",
		});
	}
	return s;
}

describe("stages", () => {
	test("outlineProfileCount counts only outline tier", () => {
		const s = stateWithOutlines(3);
		s.profiles.push({
			id: 99,
			createdAt: 0,
			fields: { name: "g" },
			sources: ["receipts"],
			tier: "ghost",
		});
		expect(outlineProfileCount(s)).toBe(3);
	});

	test("canAdvance returns null when conditions unmet", () => {
		const s = createState(1, 0);
		expect(canAdvance(s)).toBeNull();
	});

	test("canAdvance requires all three gates", () => {
		const s = stateWithOutlines(20);
		s.totalDpEarned = 500;
		s.dp = 100;
		expect(canAdvance(s)).toBeNull();
		s.upgrades.machineTier = 2;
		expect(canAdvance(s)).toBe(1);
	});

	test("advanceStageIfReady mutates stage and is idempotent", () => {
		const s = stateWithOutlines(20);
		s.totalDpEarned = 500;
		s.dp = 100;
		s.upgrades.machineTier = 2;
		expect(advanceStageIfReady(s)).toBe(true);
		expect(s.stage).toBe(1);
		expect(advanceStageIfReady(s)).toBe(false);
	});
});
