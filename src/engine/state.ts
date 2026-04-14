import { COMPUTE } from "../data/tuning.ts";

export type LogEntry = {
  at: number;
  kind: "info" | "warn";
  text: string;
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
  };
}

export function logInfo(state: GameState, text: string): void {
  state.log.push({ at: state.now, kind: "info", text });
  if (state.log.length > 200) state.log.splice(0, state.log.length - 200);
}
