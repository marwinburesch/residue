import { afterAll, beforeAll, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

beforeAll(() => GlobalRegistrator.register());
afterAll(() => GlobalRegistrator.unregister());

test("newly unlocked upgrade row appears on next render", async () => {
	const { createState } = await import("../engine/state.ts");
	const { renderUpgradePanel } = await import("./upgradePanel.ts");
	const root = document.createElement("div");
	document.body.appendChild(root);
	const s = createState(1, 0);
	s.dp = 99_999;
	const noop = () => {};
	renderUpgradePanel(root, s, noop);
	expect(root.querySelector(".upgrade-row .upgrade-name")).toBeTruthy();
	const initialNames = Array.from(root.querySelectorAll(".upgrade-name")).map(
		(el) => el.textContent,
	);
	expect(initialNames).not.toContain("Auto-restore");
	s.upgrades.autoExtract = 3;
	renderUpgradePanel(root, s, noop);
	const after = Array.from(root.querySelectorAll(".upgrade-name")).map(
		(el) => el.textContent,
	);
	expect(after).toContain("Auto-restore");
});
