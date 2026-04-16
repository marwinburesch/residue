import { createButton } from "./button.ts";
import { loadTheme, toggleTheme } from "./themeController.ts";

export type OverflowMenuDeps = {
	onReset: () => void;
};

export function mountOverflowMenu(
	trigger: HTMLElement,
	host: HTMLElement,
	deps: OverflowMenuDeps,
): void {
	const themeBtn = createButton({
		variant: "inline",
		label: labelFor(loadTheme()),
		onClick: () => {
			const next = toggleTheme();
			themeBtn.update({ label: labelFor(next) });
		},
	});
	themeBtn.el.classList.add("overflow-menu__item");

	const resetBtn = createButton({
		variant: "inline",
		label: "Reset",
		onClick: () => {
			if (!confirm("Wipe save and restart? This cannot be undone.")) return;
			deps.onReset();
		},
	});
	resetBtn.el.classList.add("overflow-menu__item");

	host.replaceChildren(themeBtn.el, resetBtn.el);

	const setOpen = (open: boolean) => {
		host.hidden = !open;
		trigger.setAttribute("aria-expanded", String(open));
	};

	trigger.addEventListener("click", (e) => {
		e.stopPropagation();
		setOpen(host.hidden);
	});

	document.addEventListener("click", (e) => {
		if (host.hidden) return;
		const target = e.target as Node | null;
		if (!target) return;
		if (host.contains(target) || trigger.contains(target)) return;
		setOpen(false);
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !host.hidden) setOpen(false);
	});

	setOpen(false);
}

function labelFor(theme: "light" | "dark"): string {
	return theme === "light" ? "Dark" : "Light";
}
