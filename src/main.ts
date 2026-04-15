import { mountApp } from "./ui/app.ts";
import { showBootScreen } from "./ui/bootScreen.ts";
import { applyTheme, loadTheme } from "./ui/themeController.ts";

applyTheme(loadTheme());
showBootScreen().then(() => mountApp(document.body));
