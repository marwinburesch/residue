import { COMPUTE } from "../data/tuning.ts";
import type { ChannelId, FieldKind } from "../data/lootPools.ts";

export type LogEntry = {
  at: number;
  kind: "info" | "warn";
  text: string;
};

export type RevealStage = 0 | 1 | 2 | 3;

export type Fragment = {
  id: number;
  kind: FieldKind;
  label: string;
  value: string;
  stage: RevealStage;
  stageTimer: number;
  corrupted: boolean;
  resolved: boolean;
};

export type Container = {
  id: number;
  channel: ChannelId;
  spawnedAt: number;
  fragments: Fragment[];
};

export type ExtractedField = {
  id: number;
  channel: ChannelId;
  kind: FieldKind;
  value: string;
  corrupted: boolean;
  extractedAt: number;
};

export type ChannelRuntime = {
  spawnAccumulator: number;
};

export type GameState = {
  version: 1;
  now: number;
  rngSeed: number;
  compute: number;
  dp: number;
  totalDpEarned: number;
  log: LogEntry[];
  lastSavedAt: number;
  nextId: number;
  channels: Record<ChannelId, ChannelRuntime>;
  containers: Container[];
  pool: ExtractedField[];
};

export function createState(seed: number, now: number): GameState {
  return {
    version: 1,
    now,
    rngSeed: seed,
    compute: COMPUTE.startingAmount,
    dp: 0,
    totalDpEarned: 0,
    log: [],
    lastSavedAt: now,
    nextId: 1,
    channels: { receipts: { spawnAccumulator: 0 } },
    containers: [],
    pool: [],
  };
}

export function nextId(state: GameState): number {
  return state.nextId++;
}

export function logInfo(state: GameState, text: string): void {
  state.log.push({ at: state.now, kind: "info", text });
  if (state.log.length > 200) state.log.splice(0, state.log.length - 200);
}
