import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import {
	discardContainer,
	discardFragment,
	drainExtracted,
	extractContainer,
	isContainerDiscardable,
	isContainerReady,
	restoreCorrupted,
	spawnContainer,
	startProcessing,
} from "./containerLifecycle.ts";
import { tickReveal } from "./fragmentTicks.ts";
import { totalProcessCost } from "./upgrades.ts";
import { REVEAL } from "../data/tuning.ts";

describe("startProcessing", () => {
	test("pays full cost and enables timed reveal", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.find((f) => !f.corrupted);
		if (!uncorrupted) return;
		s.compute = 100;
		const before = s.compute;
		const cost = totalProcessCost(s, 0);
		expect(startProcessing(s, uncorrupted.id)).toBe(true);
		expect(s.compute).toBe(before - cost);
		expect(uncorrupted.processing).toBe(true);
		tickReveal(s, REVEAL.stageAdvanceMs);
		expect(uncorrupted.stage).toBe(1);
		tickReveal(s, REVEAL.stageAdvanceMs * 3);
		expect(uncorrupted.stage).toBe(3);
		expect(uncorrupted.processing).toBe(false);
	});

	test("rejects when already processing", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.find((f) => !f.corrupted);
		if (!uncorrupted) return;
		s.compute = 100;
		expect(startProcessing(s, uncorrupted.id)).toBe(true);
		expect(startProcessing(s, uncorrupted.id)).toBe(false);
	});

	test("fails when Compute is insufficient", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.find((f) => !f.corrupted);
		if (!uncorrupted) return;
		s.compute = 0;
		expect(startProcessing(s, uncorrupted.id)).toBe(false);
		expect(uncorrupted.processing).toBe(false);
		expect(uncorrupted.stage).toBe(0);
	});
});

describe("extraction", () => {
	test("extractContainer commits ready fields, awards DP bonus, removes container", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		let ready = 0;
		for (const f of c.fragments) {
			if (!f.corrupted) {
				f.stage = 3;
				ready++;
			}
		}
		const dpBefore = s.dp;
		expect(isContainerReady(c)).toBe(true);
		expect(extractContainer(s, c.id)).toBe(true);
		expect(s.containers.length).toBe(0);
		expect(s.dp).toBe(dpBefore + ready * REVEAL.extractBonusDpPerField);
		const batches = drainExtracted(s);
		expect(batches.length).toBe(1);
		expect(batches[0]!.length).toBe(ready);
	});

	test("isContainerReady is false while any fragment is still revealing", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.filter((f) => !f.corrupted);
		if (uncorrupted.length < 2) return;
		uncorrupted[0]!.stage = 3;
		uncorrupted[1]!.stage = 1;
		expect(isContainerReady(c)).toBe(false);
		uncorrupted[1]!.stage = 3;
		expect(isContainerReady(c)).toBe(true);
	});

	test("extractContainer fails when no field is ready", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		expect(extractContainer(s, c.id)).toBe(false);
		expect(s.containers.length).toBe(1);
	});

	test("extractContainer discards unrevealed and corrupted fragments with the container", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.find((f) => !f.corrupted);
		if (!uncorrupted) return;
		uncorrupted.stage = 3;
		expect(extractContainer(s, c.id)).toBe(true);
		expect(s.containers.length).toBe(0);
	});

	test("drainExtracted returns empty when nothing pending", () => {
		const s = createState(42, 0);
		expect(drainExtracted(s)).toEqual([]);
	});
});

describe("corrupted fields", () => {
	test("restoration charges Compute and clears corrupted flag on success", () => {
		const s = createState(7, 0);
		const c = spawnContainer(s, "receipts");
		const corrupted = c.fragments.find((f) => f.corrupted);
		if (!corrupted) return;
		s.compute = 100;
		restoreCorrupted(s, corrupted.id);
		expect(s.compute).toBe(100 - REVEAL.corruptionRestoreCost);
	});

	test("discard marks the fragment resolved", () => {
		const s = createState(1, 0);
		const c = spawnContainer(s, "receipts");
		const f = c.fragments[0];
		if (!f) return;
		expect(discardFragment(s, f.id)).toBe(true);
		expect(f.resolved).toBe(true);
	});
});

describe("discardContainer", () => {
	test("is not discardable while any fragment is live", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		expect(isContainerDiscardable(c)).toBe(false);
		expect(discardContainer(s, c.id)).toBe(false);
		expect(s.containers.length).toBe(1);
	});

	test("becomes discardable when every fragment is resolved or corrupted", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		for (const f of c.fragments) {
			if (!f.corrupted) f.resolved = true;
		}
		expect(isContainerDiscardable(c)).toBe(true);
	});

	test("removes the container, costs nothing, and logs", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		for (const f of c.fragments) f.resolved = true;
		const computeBefore = s.compute;
		expect(discardContainer(s, c.id)).toBe(true);
		expect(s.containers.length).toBe(0);
		expect(s.compute).toBe(computeBefore);
		expect(
			s.log.some((e) => e.text.includes(`Container #${c.id} discarded`)),
		).toBe(true);
	});

	test("rejects when a fragment is still processable", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const live = c.fragments.find((f) => !f.corrupted && !f.resolved);
		if (!live) return;
		for (const f of c.fragments) {
			if (f !== live) f.resolved = true;
		}
		expect(isContainerDiscardable(c)).toBe(false);
		expect(discardContainer(s, c.id)).toBe(false);
		expect(s.containers.length).toBe(1);
	});
});
