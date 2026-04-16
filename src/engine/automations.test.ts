import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import { automationStatuses } from "./automations.ts";
import {
	AUTO_EXTRACT_COOLDOWNS_MS,
	AUTO_RESTORE_COOLDOWNS_MS,
	PROCESS_AUTO_COOLDOWNS_MS,
} from "../data/upgradeTree.ts";

describe("automationStatuses", () => {
	test("returns empty list when no automation upgrades are owned", () => {
		const s = createState(1, 0);
		expect(automationStatuses(s)).toEqual([]);
	});

	test("excludes processAuto at level 1 (manual batch only)", () => {
		const s = createState(1, 0);
		s.upgrades.processAuto = 1;
		const statuses = automationStatuses(s);
		expect(statuses.find((x) => x.id === "processAuto")).toBeUndefined();
	});

	test("includes processAuto at level 2 with correct cooldown", () => {
		const s = createState(1, 0);
		s.upgrades.processAuto = 2;
		const status = automationStatuses(s).find((x) => x.id === "processAuto");
		expect(status).toBeDefined();
		expect(status!.level).toBe(2);
		expect(status!.cooldownMs).toBe(PROCESS_AUTO_COOLDOWNS_MS[0]);
	});

	test("autoExtract cooldown reflects upgrade level", () => {
		const s = createState(1, 0);
		s.upgrades.autoExtract = 3;
		const status = automationStatuses(s).find((x) => x.id === "autoExtract");
		expect(status).toBeDefined();
		expect(status!.cooldownMs).toBe(AUTO_EXTRACT_COOLDOWNS_MS[2]);
	});

	test("autoRestore included when owned", () => {
		const s = createState(1, 0);
		s.upgrades.autoRestore = 1;
		const status = automationStatuses(s).find((x) => x.id === "autoRestore");
		expect(status).toBeDefined();
		expect(status!.cooldownMs).toBe(AUTO_RESTORE_COOLDOWNS_MS[0]);
	});

	test("progress clamps between 0 and 1", () => {
		const s = createState(1, 0);
		s.upgrades.autoExtract = 1;
		s.autoExtractTimer = AUTO_EXTRACT_COOLDOWNS_MS[0]! * 5;
		const status = automationStatuses(s).find((x) => x.id === "autoExtract")!;
		expect(status.progress).toBe(1);

		s.autoExtractTimer = -500;
		const status2 = automationStatuses(s).find((x) => x.id === "autoExtract")!;
		expect(status2.progress).toBe(0);
	});

	test("progress reflects elapsed / cooldown ratio", () => {
		const s = createState(1, 0);
		s.upgrades.autoExtract = 1;
		s.autoExtractTimer = AUTO_EXTRACT_COOLDOWNS_MS[0]! / 4;
		const status = automationStatuses(s).find((x) => x.id === "autoExtract")!;
		expect(status.progress).toBeCloseTo(0.25, 5);
	});
});
