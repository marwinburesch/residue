import type { StageId } from "../data/stageConfig.ts";

export function applyToneStage(stage: StageId): void {
  document.body.dataset.toneStage = String(stage);
}
