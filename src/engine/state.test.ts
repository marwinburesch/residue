import { describe, expect, test } from "bun:test";
import { createState, logInfo, logWarn, nextId } from "./state.ts";
import { COMPUTE } from "../data/tuning.ts";

describe("createState", () => {
	test("seeds version, timing, and starting resources", () => {
		const s = createState(7, 1000);
		expect(s.version).toBe(1);
		expect(s.now).toBe(1000);
		expect(s.rngSeed).toBe(7);
		expect(s.lastSavedAt).toBe(1000);
		expect(s.compute).toBe(COMPUTE.startingAmount);
		expect(s.dp).toBe(0);
		expect(s.totalDpEarned).toBe(0);
	});

	test("initializes empty collections and the receipts channel", () => {
		const s = createState(1, 0);
		expect(s.log).toEqual([]);
		expect(s.containers).toEqual([]);
		expect(s.pendingExtractions).toEqual([]);
		expect(s.profiles).toEqual([]);
		expect(s.milestonesFired).toEqual([]);
		expect(s.upgrades).toEqual({});
		expect(s.channels.receipts).toEqual({ spawnAccumulator: 0 });
	});

	test("starts at stage 0 with a clean suspicion state", () => {
		const s = createState(1, 0);
		expect(s.stage).toBe(0);
		expect(s.suspicion).toEqual({
			level: 0,
			recentActions: [],
			warned: false,
		});
	});
});

describe("nextId", () => {
	test("returns an incrementing sequence starting at 1", () => {
		const s = createState(1, 0);
		expect(nextId(s)).toBe(1);
		expect(nextId(s)).toBe(2);
		expect(nextId(s)).toBe(3);
		expect(s.nextId).toBe(4);
	});
});

describe("log", () => {
	test("logInfo appends an info entry stamped with state.now", () => {
		const s = createState(1, 5000);
		logInfo(s, "hello");
		expect(s.log).toEqual([{ at: 5000, kind: "info", text: "hello" }]);
	});

	test("logWarn appends a warn entry", () => {
		const s = createState(1, 42);
		logWarn(s, "careful");
		expect(s.log).toEqual([{ at: 42, kind: "warn", text: "careful" }]);
	});

	test("caps log length at 200 entries, dropping the oldest", () => {
		const s = createState(1, 0);
		for (let i = 0; i < 205; i++) logInfo(s, `msg ${i}`);
		expect(s.log.length).toBe(200);
		expect(s.log[0]!.text).toBe("msg 5");
		expect(s.log[199]!.text).toBe("msg 204");
	});
});
