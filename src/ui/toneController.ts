import type { StageId } from "../data/stageConfig.ts";
import { setStage as setAudioStage } from "./audio.ts";

const SUBTITLES: Record<StageId, string> = {
  0: "Expense Records / Field Extraction",
  1: "Expense Records / Entity Extraction",
};

let lastStage: StageId | null = null;

export function applyToneStage(stage: StageId): void {
  if (lastStage === stage) return;
  lastStage = stage;
  document.body.dataset.toneStage = String(stage);
  const subtitle = document.querySelector<HTMLElement>("#topbar .subtitle");
  if (subtitle) subtitle.textContent = SUBTITLES[stage];
  setAudioStage(stage);
}
