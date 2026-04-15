import type { StageId } from "../data/stageConfig.ts";

const SUBTITLES: Record<StageId, string> = {
  0: "Expense Records / Field Extraction",
  1: "Expense Records / Entity Extraction",
};

export function applyToneStage(stage: StageId): void {
  document.body.dataset.toneStage = String(stage);
  const subtitle = document.querySelector<HTMLElement>("#topbar .subtitle");
  if (subtitle) subtitle.textContent = SUBTITLES[stage];
}
