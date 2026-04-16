export type PanelId = "records" | "ops" | "registry";

export type TabsController = {
	activate(id: PanelId): void;
	current(): PanelId;
};

const TABS: ReadonlyArray<{ id: PanelId; label: string }> = [
	{ id: "records", label: "Records" },
	{ id: "ops", label: "Ops" },
	{ id: "registry", label: "Registry" },
];

const isMobile = () => window.matchMedia("(max-width: 899px)").matches;

export function mountTabs(
	nav: HTMLElement,
	scrim: HTMLElement,
): TabsController {
	const panels = new Map<PanelId, HTMLElement>();
	for (const el of document.querySelectorAll<HTMLElement>(".panel")) {
		const id = el.dataset.panel as PanelId | undefined;
		if (id === "records" || id === "ops" || id === "registry")
			panels.set(id, el);
	}

	const buttons = new Map<PanelId, HTMLButtonElement>();
	let activeId: PanelId = "records";

	const apply = () => {
		for (const [id, btn] of buttons)
			btn.classList.toggle("is-active", id === activeId);
		for (const [id, el] of panels)
			el.classList.toggle("is-active", id === activeId);
		scrim.hidden = false;
		scrim.classList.toggle("is-visible", activeId !== "records");
	};

	const set = (id: PanelId) => {
		activeId = id;
		apply();
	};

	for (const tab of TABS) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "nav-btn";
		btn.role = "tab";
		btn.textContent = tab.label;
		btn.addEventListener("click", () => {
			if (tab.id === "records") set("records");
			else if (isMobile() && activeId === tab.id) set("records");
			else set(tab.id);
		});
		buttons.set(tab.id, btn);
		nav.appendChild(btn);
	}

	scrim.addEventListener("click", () => set("records"));
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && activeId !== "records" && isMobile())
			set("records");
	});

	apply();
	return {
		activate: set,
		current: () => activeId,
	};
}
