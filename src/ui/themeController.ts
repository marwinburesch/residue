export type Theme = "light" | "dark";

const KEY = "residue:theme";

export function loadTheme(): Theme {
	const v = localStorage.getItem(KEY);
	return v === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
	document.documentElement.dataset.theme = theme;
	localStorage.setItem(KEY, theme);
}

export function toggleTheme(): Theme {
	const next: Theme = loadTheme() === "light" ? "dark" : "light";
	applyTheme(next);
	return next;
}
