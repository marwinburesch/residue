import { describe, expect, test } from "bun:test";
import { fireMilestone } from "./milestones.ts";
import { createState } from "./state.ts";
import { MILESTONES } from "../data/narrative.ts";

describe("fireMilestone", () => {
	test("appends the milestone text to the log on first fire", () => {
		const s = createState(1, 100);
		fireMilestone(s, "firstFragmentOpened");
		expect(s.milestonesFired).toEqual(["firstFragmentOpened"]);
		expect(s.log).toEqual([
			{ at: 100, kind: "info", text: MILESTONES.firstFragmentOpened },
		]);
	});

	test("is idempotent — re-firing does not log again", () => {
		const s = createState(1, 0);
		fireMilestone(s, "firstFragmentOpened");
		fireMilestone(s, "firstFragmentOpened");
		expect(s.milestonesFired).toEqual(["firstFragmentOpened"]);
		expect(s.log.length).toBe(1);
	});

	test("routes [WARN]-prefixed milestones through logWarn", () => {
		const s = createState(1, 0);
		fireMilestone(s, "firstCorruptedField");
		expect(s.log[0]!.kind).toBe("warn");
		expect(s.log[0]!.text).toBe(MILESTONES.firstCorruptedField);
	});

	test("routes non-warn milestones through logInfo", () => {
		const s = createState(1, 0);
		fireMilestone(s, "fifthProfile");
		expect(s.log[0]!.kind).toBe("info");
	});

	test("tracks multiple distinct milestones in fire order", () => {
		const s = createState(1, 0);
		fireMilestone(s, "firstFragmentOpened");
		fireMilestone(s, "firstOutline");
		fireMilestone(s, "stage1Unlock");
		expect(s.milestonesFired).toEqual([
			"firstFragmentOpened",
			"firstOutline",
			"stage1Unlock",
		]);
		expect(s.log.length).toBe(3);
	});
});
