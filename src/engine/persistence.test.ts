import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import { deserialize, reconcileOffline, serialize } from "./persistence.ts";
import { ingestBatch } from "./profiles.ts";
import type { ExtractedField } from "./state.ts";
import { DP, OFFLINE } from "../data/tuning.ts";

function field(
	id: number,
	kind: ExtractedField["kind"],
	value: string,
): ExtractedField {
	return {
		id,
		channel: "receipts",
		kind,
		value,
		corrupted: false,
		extractedAt: 0,
	};
}

describe("serialize/deserialize", () => {
	test("round-trips a state snapshot", () => {
		const s = createState(99, 12345);
		ingestBatch(s, [field(1, "name", "T. Marlow")]);
		const raw = serialize(s, 99_999);
		const parsed = deserialize(raw);
		expect(parsed).not.toBeNull();
		expect(parsed!.rngSeed).toBe(99);
		expect(parsed!.profiles.length).toBe(1);
		expect(parsed!.lastSavedAt).toBe(99_999);
	});

	test("returns null for malformed data", () => {
		expect(deserialize("{}")).toBeNull();
		expect(deserialize("not json")).toBeNull();
	});

	test("round-trips pendingStageTransition", () => {
		const s = createState(1, 0);
		s.pendingStageTransition = 1;
		const parsed = deserialize(serialize(s, 100))!;
		expect(parsed.pendingStageTransition).toBe(1);
	});

	test("older saves without pendingStageTransition default to null", () => {
		const s = createState(1, 0);
		const raw = JSON.parse(serialize(s, 100));
		delete raw.pendingStageTransition;
		const parsed = deserialize(JSON.stringify(raw))!;
		expect(parsed.pendingStageTransition).toBeNull();
	});
});

describe("offline reconciliation", () => {
	test("skips when elapsed is below idle threshold", () => {
		const s = createState(1, 0);
		ingestBatch(s, [field(1, "name", "T. Marlow")]);
		s.lastSavedAt = 0;
		const report = reconcileOffline(s, OFFLINE.minIdleMs - 1);
		expect(report).toBeNull();
		expect(s.dp).toBe(0);
	});

	test("awards 25% of the online DP rate over elapsed time", () => {
		const s = createState(1, 0);
		ingestBatch(s, [field(1, "name", "T. Marlow")]);
		s.lastSavedAt = 0;
		const elapsedMs = 10 * 60 * 1000;
		const report = reconcileOffline(s, elapsedMs);
		const expected =
			DP.perFieldPerSecondGhost * (elapsedMs / 1000) * OFFLINE.rate;
		expect(report).not.toBeNull();
		expect(report!.awardedDp).toBeCloseTo(expected, 5);
		expect(s.dp).toBeCloseTo(expected, 5);
	});

	test("caps at the configured maximum", () => {
		const s = createState(1, 0);
		ingestBatch(s, [field(1, "name", "T. Marlow")]);
		s.lastSavedAt = 0;
		const report = reconcileOffline(s, OFFLINE.capMs * 10);
		expect(report!.capped).toBe(true);
		expect(report!.elapsedMs).toBe(OFFLINE.capMs);
	});

	test("treats negative elapsed (clock skew) as zero", () => {
		const s = createState(1, 0);
		s.lastSavedAt = 1_000_000;
		const report = reconcileOffline(s, 500_000);
		expect(report).toBeNull();
		expect(s.dp).toBe(0);
	});
});
