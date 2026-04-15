import { mountApp } from "./ui/app.ts";
import { showBootScreen } from "./ui/bootScreen.ts";
import { startDrone } from "./ui/audio.ts";

showBootScreen().then(() => {
  mountApp(document.body);
  const stage = (Number(document.body.dataset.toneStage) || 0) as 0 | 1;
  startDrone(stage);
});
