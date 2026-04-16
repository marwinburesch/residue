import { describe, expect, test } from "bun:test";
import { createRng, pick, pickWeighted } from "./rng.ts";

describe("createRng", () => {
	test("produces values in [0, 1)", () => {
		const rng = createRng(1);
		for (let i = 0; i < 1000; i++) {
			const v = rng();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	test("is deterministic for a given seed", () => {
		const a = createRng(12345);
		const b = createRng(12345);
		for (let i = 0; i < 100; i++) {
			expect(a()).toBe(b());
		}
	});

	test("different seeds produce different streams", () => {
		const a = createRng(1);
		const b = createRng(2);
		let diffs = 0;
		for (let i = 0; i < 20; i++) {
			if (a() !== b()) diffs++;
		}
		expect(diffs).toBeGreaterThan(0);
	});

	test("seed is coerced to uint32 (negative and large seeds are stable)", () => {
		const a = createRng(-1);
		const b = createRng(0xffffffff);
		expect(a()).toBe(b());
	});
});

describe("pick", () => {
	test("returns an element from the array", () => {
		const rng = createRng(7);
		const items = ["a", "b", "c"] as const;
		for (let i = 0; i < 50; i++) {
			expect(items).toContain(pick(rng, items));
		}
	});

	test("throws on an empty array", () => {
		const rng = createRng(1);
		expect(() => pick(rng, [])).toThrow();
	});

	test("returns the only element of a singleton array", () => {
		const rng = createRng(1);
		expect(pick(rng, ["only"])).toBe("only");
	});
});

describe("pickWeighted", () => {
	test("only returns items with non-zero weight", () => {
		const rng = createRng(99);
		const items = [
			{ name: "skip", weight: 0 },
			{ name: "keep", weight: 1 },
		];
		for (let i = 0; i < 50; i++) {
			expect(pickWeighted(rng, items).name).toBe("keep");
		}
	});

	test("distribution roughly tracks weights", () => {
		const rng = createRng(4242);
		const items = [
			{ name: "a", weight: 1 },
			{ name: "b", weight: 9 },
		];
		const counts = { a: 0, b: 0 };
		for (let i = 0; i < 5000; i++) {
			counts[pickWeighted(rng, items).name as "a" | "b"]++;
		}
		expect(counts.b).toBeGreaterThan(counts.a * 3);
	});

	test("returns the only weighted item when others have zero weight", () => {
		const rng = createRng(1);
		const items = [
			{ name: "only", weight: 5 },
			{ name: "zero", weight: 0 },
		];
		expect(pickWeighted(rng, items).name).toBe("only");
	});
});
