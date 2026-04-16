import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import { spawnContainer } from "./containerLifecycle.ts";
import {
	tickAutoExtract,
	tickAutoRestore,
	tickChannels,
	tickReveal,
} from "./fragmentTicks.ts";
import {
	AUTO_EXTRACT_COOLDOWNS_MS,
	AUTO_RESTORE_COOLDOWNS_MS,
} from "../data/upgradeTree.ts";
import { CHANNEL, REVEAL } from "../data/tuning.ts";

describe("tickChannels", () => {
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

describe("tickReveal", () => {
	test("does not advance un-processed fragments", () => {
		const s = createState(42, 0);
		const c = spawnContainer(s, "receipts");
		const uncorrupted = c.fragments.find((f) => !f.corrupted);
		if (!uncorrupted) return;
		tickReveal(s, REVEAL.stageAdvanceMs * 10);
		expect(uncorrupted.stage).toBe(0);
		expect(uncorrupted.processing).toBe(false);
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

describe("tickAutoExtract", () => {
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

describe("tickAutoRestore", () => {
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
