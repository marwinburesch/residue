import { CHANNEL, REVEAL } from "../data/tuning.ts";
import { channels as channelDefs } from "../data/lootPools.ts";
import type { ChannelId } from "../data/lootPools.ts";
import { pick, pickWeighted, createRng } from "./rng.ts";
import type { Rng } from "./rng.ts";
import {
  logInfo,
  nextId,
  type Container,
  type ExtractedField,
  type Fragment,
  type GameState,
  type RevealStage,
} from "./state.ts";
import { spendCompute } from "./resources.ts";
import { recordAction } from "./suspicion.ts";
import { containerCap, revealStageCost } from "./upgrades.ts";

function rngFor(state: GameState, tag: number): Rng {
  return createRng(state.rngSeed ^ tag);
}

export function spawnContainer(state: GameState, channel: ChannelId): Container {
  const def = channelDefs[channel];
  const rng = rngFor(state, state.nextId * 2654435761);
  const [min, max] = def.fieldsPerContainer;
  const count = min + Math.floor(rng() * (max - min + 1));
  const fragments: Fragment[] = [];
  for (let i = 0; i < count; i++) {
    const fieldDef = pickWeighted(rng, def.pool);
    fragments.push({
      id: nextId(state),
      kind: fieldDef.kind,
      label: fieldDef.label,
      value: pick(rng, fieldDef.samples),
      stage: 0,
      stageTimer: 0,
      corrupted: rng() < REVEAL.corruptionChance,
      resolved: false,
    });
  }
  const container: Container = {
    id: nextId(state),
    channel,
    spawnedAt: state.now,
    fragments,
  };
  state.containers.push(container);
  return container;
}

export function tickChannels(state: GameState, dtMs: number): void {
  const rt = state.channels.receipts;
  rt.spawnAccumulator += (dtMs / 1000) * CHANNEL.receiptsSpawnPerSecond;
  const cap = containerCap(state);
  while (rt.spawnAccumulator >= 1 && state.containers.length < cap) {
    rt.spawnAccumulator -= 1;
    spawnContainer(state, "receipts");
  }
  if (rt.spawnAccumulator > 1 && state.containers.length >= cap) {
    rt.spawnAccumulator = 1;
  }
}

export function tickReveal(state: GameState, dtMs: number): void {
  for (const container of state.containers) {
    for (const f of container.fragments) {
      if (f.resolved || f.corrupted) continue;
      f.stageTimer += dtMs;
      if (f.stage === 3) continue;
      while (f.stageTimer >= REVEAL.stageAdvanceMs && f.stage < 3) {
        f.stageTimer -= REVEAL.stageAdvanceMs;
        f.stage = (f.stage + 1) as RevealStage;
        if (f.stage === 3) f.stageTimer = 0;
      }
    }
  }
}

export function advanceReveal(state: GameState, fragmentId: number): boolean {
  const fragment = findFragment(state, fragmentId);
  if (!fragment || fragment.resolved || fragment.corrupted) return false;
  if (fragment.stage >= 3) return false;
  const cost = revealStageCost(state, fragment.stage as 0 | 1 | 2);
  if (!spendCompute(state, cost)) return false;
  fragment.stage = (fragment.stage + 1) as RevealStage;
  fragment.stageTimer = 0;
  recordAction(state);
  return true;
}

export function restoreCorrupted(state: GameState, fragmentId: number): boolean {
  const fragment = findFragment(state, fragmentId);
  if (!fragment || !fragment.corrupted || fragment.resolved) return false;
  if (!spendCompute(state, REVEAL.corruptionRestoreCost)) return false;
  const rng = rngFor(state, fragment.id * 16807);
  if (rng() < REVEAL.corruptionRestoreChance) {
    fragment.corrupted = false;
    fragment.stageTimer = 0;
    return true;
  }
  fragment.resolved = true;
  logInfo(state, `[INFO] Field ${fragment.label.toLowerCase()} unrecoverable.`);
  return true;
}

export function discardFragment(state: GameState, fragmentId: number): boolean {
  const fragment = findFragment(state, fragmentId);
  if (!fragment || fragment.resolved) return false;
  fragment.resolved = true;
  return true;
}

export function isContainerReady(container: Container): boolean {
  return container.fragments.some(
    (f) => !f.resolved && !f.corrupted && f.stage === 3,
  );
}

export function extractContainer(state: GameState, containerId: number): boolean {
  const idx = state.containers.findIndex((c) => c.id === containerId);
  if (idx === -1) return false;
  const container = state.containers[idx]!;
  const batch: ExtractedField[] = [];
  for (const f of container.fragments) {
    if (!f.resolved && !f.corrupted && f.stage === 3) {
      batch.push({
        id: f.id,
        channel: container.channel,
        kind: f.kind,
        value: f.value,
        corrupted: false,
        extractedAt: state.now,
      });
      f.resolved = true;
    }
  }
  if (batch.length === 0) return false;
  const bonus = batch.length * REVEAL.extractBonusDpPerField;
  state.dp += bonus;
  state.totalDpEarned += bonus;
  state.pendingExtractions.push(batch);
  state.containers.splice(idx, 1);
  return true;
}

export function drainExtracted(state: GameState): ExtractedField[][] {
  if (state.pendingExtractions.length === 0) return [];
  const batches = state.pendingExtractions;
  state.pendingExtractions = [];
  return batches;
}

function findFragment(state: GameState, id: number): Fragment | undefined {
  for (const c of state.containers) {
    const f = c.fragments.find((x) => x.id === id);
    if (f) return f;
  }
  return undefined;
}
