import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import {
	drainExtracted,
	discardFragment,
	extractContainer,
	isContainerReady,
	restoreCorrupted,
	spawnContainer,
	startProcessing,
	tickAutoExtract,
	tickAutoRestore,
	tickChannels,
	tickReveal,
} from "./fragments.ts";
import { totalProcessCost } from "./upgrades.ts";
import {
	AUTO_EXTRACT_COOLDOWNS_MS,
	AUTO_RESTORE_COOLDOWNS_MS,
} from "../data/upgradeTree.ts";
import { CHANNEL, REVEAL } from "../data/tuning.ts";

describe("channel spawning", () => {
	test("accumulates toward a spawn at the configured rate", () => {
		const s = createState(42, 0);
		tickChannels(s, 1000 / CHANNEL.receiptsSpawnPerSecond);
		expect(s.containers.length).toBe(1);
	});

	test("respects the container cap", () => {
		const s = createState(42, 0);
		for (let i = 0; i < CHANNEL.receiptsContainerCap + 3; i++) {
			spawnContainer(s, "receipts");
		}
		tickChannels(s, 60_000);
		expect(s.containers.length).toBe(CHANNEL.receiptsContainerCap + 3);
	});
});

describe("processing", () => {
	test("ticking does not advance un-processed fragments", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.find((f) => !f.corrupted);
		if (!uncorrupted) return;
		tickReveal(s, REVEAL.stageAdvanceMs * 10);
		expect(uncorrupted.stage).toBe(0);
		expect(uncorrupted.processing).toBe(false);
	});

	test("startProcessing pays full cost and enables timed reveal", () => {
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

	test("startProcessing rejects when already processing", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.find((f) => !f.corrupted);
		if (!uncorrupted) return;
		s.compute = 100;
		expect(startProcessing(s, uncorrupted.id)).toBe(true);
		expect(startProcessing(s, uncorrupted.id)).toBe(false);
	});

	test("startProcessing fails when Compute is insufficient", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.find((f) => !f.corrupted);
		if (!uncorrupted) return;
		s.compute = 0;
		expect(startProcessing(s, uncorrupted.id)).toBe(false);
		expect(uncorrupted.processing).toBe(false);
		expect(uncorrupted.stage).toBe(0);
	});

	test("corrupted fragments do not auto-reveal", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const corrupted = c.fragments.find((f) => f.corrupted);
		if (!corrupted) return;
		corrupted.processing = true;
		tickReveal(s, REVEAL.stageAdvanceMs * 10);
		expect(corrupted.stage).toBe(0);
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

describe("auto-extract", () => {
	test("does nothing when upgrade is unpurchased", () => {
		const s = createState(3, 0);
		const c = spawnContainer(s, "receipts");
		for (const f of c.fragments) {
			f.corrupted = false;
			f.stage = 3;
		}
		tickAutoExtract(s, 60_000);
		expect(s.containers.length).toBe(1);
	});

	test("tier 1 extracts a clean container after its cooldown", () => {
		const s = createState(3, 0);
		s.upgrades.autoExtract = 1;
		const c = spawnContainer(s, "receipts");
		for (const f of c.fragments) {
			f.corrupted = false;
			f.stage = 3;
		}
		const cd = AUTO_EXTRACT_COOLDOWNS_MS[0]!;
		tickAutoExtract(s, cd - 1);
		expect(s.containers.length).toBe(1);
		tickAutoExtract(s, 2);
		expect(s.containers.length).toBe(0);
	});

	test("tier 1 skips containers with any corrupted fragment", () => {
		const s = createState(3, 0);
		s.upgrades.autoExtract = 1;
		const c = spawnContainer(s, "receipts");
		for (const f of c.fragments) f.stage = 3;
		c.fragments[0]!.corrupted = true;
		tickAutoExtract(s, AUTO_EXTRACT_COOLDOWNS_MS[0]! + 1);
		expect(s.containers.length).toBe(1);
	});
});

describe("auto-restore", () => {
	test("does nothing when upgrade is unpurchased", () => {
		const s = createState(3, 0);
		s.compute = 50;
		spawnContainer(s, "receipts");
		const before = s.compute;
		tickAutoRestore(s, 60_000);
		expect(s.compute).toBe(before);
	});

	test("spends compute attempting to restore after cooldown", () => {
		const s = createState(3, 0);
		s.upgrades.autoRestore = 1;
		s.compute = 50;
		const c = spawnContainer(s, "receipts");
		const corrupted = c.fragments.find((f) => f.corrupted);
		if (!corrupted) return;
		const before = s.compute;
		tickAutoRestore(s, AUTO_RESTORE_COOLDOWNS_MS[0]! + 1);
		expect(s.compute).toBeLessThan(before);
	});
});
