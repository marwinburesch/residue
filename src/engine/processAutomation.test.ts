import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import { deserialize, serialize } from "./persistence.ts";
import {
	extractAllReady,
	isContainerReady,
	processAllInContainer,
	spawnContainer,
} from "./containerLifecycle.ts";
import { tickAutoProcess } from "./fragmentTicks.ts";
import { totalProcessCost } from "./upgrades.ts";
import { PROCESS_AUTO_COOLDOWNS_MS } from "../data/upgradeTree.ts";

function seedUsable(seed: number): ReturnType<typeof createState> {
	const s = createState(seed, 0);
	s.compute = 1000;
	return s;
}

describe("processAllInContainer", () => {
	test("starts all eligible fragments in a container", () => {
		const s = seedUsable(7);
		const c = spawnContainer(s, "receipts");
		const eligible = c.fragments.filter((f) => !f.corrupted && !f.resolved);
		const started = processAllInContainer(s, c.id);
		expect(started).toBe(eligible.length);
		for (const f of eligible) expect(f.processing).toBe(true);
	});

	test("skips corrupted, resolved, processing, and stage-3 fragments", () => {
		const s = seedUsable(9);
		const c = spawnContainer(s, "receipts");
		const fragments = c.fragments;
		if (fragments.length < 2) return;
		fragments[0]!.corrupted = false;
		fragments[0]!.resolved = true;
		fragments[1]!.corrupted = false;
		fragments[1]!.processing = true;
		const computeBefore = s.compute;
		processAllInContainer(s, c.id);
		expect(fragments[0]!.processing).toBe(false);
		const untouched = s.compute === computeBefore;
		const others = fragments.filter(
			(_, i) => i >= 2 && !fragments[i]!.corrupted,
		);
		if (others.length === 0) {
			expect(untouched).toBe(true);
		}
	});

	test("stops when compute is exhausted", () => {
		const s = seedUsable(11);
		const c = spawnContainer(s, "receipts");
		const eligible = c.fragments.filter((f) => !f.corrupted && !f.resolved);
		if (eligible.length < 2) return;
		const firstCost = totalProcessCost(s, 0);
		s.compute = firstCost;
		const started = processAllInContainer(s, c.id);
		expect(started).toBe(1);
		expect(eligible[0]!.processing).toBe(true);
		expect(eligible[1]!.processing).toBe(false);
	});

	test("returns 0 for unknown container", () => {
		const s = seedUsable(1);
		expect(processAllInContainer(s, 9999)).toBe(0);
	});
});

describe("tickAutoProcess", () => {
	test("no-op at level < 2", () => {
		const s = seedUsable(5);
		const c = spawnContainer(s, "receipts");
		s.upgrades.processAuto = 1;
		tickAutoProcess(s, 60_000);
		for (const f of c.fragments) expect(f.processing).toBe(false);
	});

	test("starts one fragment after cooldown at level 2", () => {
		const s = seedUsable(5);
		const c = spawnContainer(s, "receipts");
		s.upgrades.processAuto = 2;
		tickAutoProcess(s, PROCESS_AUTO_COOLDOWNS_MS[0]! + 1);
		const processing = c.fragments.filter((f) => f.processing).length;
		const eligible = c.fragments.some((f) => !f.corrupted && !f.resolved);
		expect(processing).toBe(eligible ? 1 : 0);
	});

	test("does not fire before cooldown elapses", () => {
		const s = seedUsable(5);
		const c = spawnContainer(s, "receipts");
		s.upgrades.processAuto = 2;
		tickAutoProcess(s, PROCESS_AUTO_COOLDOWNS_MS[0]! - 10);
		for (const f of c.fragments) expect(f.processing).toBe(false);
	});

	test("skips when compute is insufficient", () => {
		const s = seedUsable(5);
		const c = spawnContainer(s, "receipts");
		s.upgrades.processAuto = 2;
		s.compute = 0;
		tickAutoProcess(s, PROCESS_AUTO_COOLDOWNS_MS[0]! + 1);
		for (const f of c.fragments) expect(f.processing).toBe(false);
	});
});

describe("extractAllReady", () => {
	test("extracts every ready container and returns count", () => {
		const s = seedUsable(13);
		const c1 = spawnContainer(s, "receipts");
		const c2 = spawnContainer(s, "receipts");
		for (const c of [c1, c2]) {
			for (const f of c.fragments) {
				if (f.corrupted) f.resolved = true;
				else f.stage = 3;
			}
		}
		const readyCount = [c1, c2].filter(isContainerReady).length;
		const extracted = extractAllReady(s);
		expect(extracted).toBe(readyCount);
	});

	test("no-op when nothing ready", () => {
		const s = seedUsable(14);
		spawnContainer(s, "receipts");
		expect(extractAllReady(s)).toBe(0);
	});
});

describe("save compat", () => {
	test("loads state missing processAutoTimer and processAuto level", () => {
		const s = seedUsable(2);
		const raw = serialize(s, 0);
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		delete parsed.processAutoTimer;
		delete (parsed.upgrades as Record<string, unknown>).processAuto;
		const restored = deserialize(JSON.stringify(parsed));
		expect(restored).not.toBeNull();
		expect(restored!.processAutoTimer).toBe(0);
		expect(restored!.upgrades.processAuto ?? 0).toBe(0);
	});
});
