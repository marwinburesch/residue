import { mountApp } from "./ui/app.ts";
import { showBootScreen } from "./ui/bootScreen.ts";

showBootScreen().then(() => mountApp(document.body));
