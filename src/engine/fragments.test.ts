import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import {
  advanceReveal,
  collectExtracted,
  discardFragment,
  restoreCorrupted,
  spawnContainer,
  tickChannels,
  tickReveal,
} from "./fragments.ts";
import { CHANNEL, REVEAL } from "../data/tuning.ts";

describe("channel spawning", () => {
  test("accumulates toward a spawn at the configured rate", () => {
    const s = createState(42, 0);
    tickChannels(s, 1000 / CHANNEL.receiptsSpawnPerSecond);
    expect(s.containers.length).toBe(1);
  });

  test("respects the container cap", () => {
    const s = createState(42, 0);
    for (let i = 0; i < CHANNEL.receiptsContainerCap + 3; i++) {
      spawnContainer(s, "receipts");
    }
    tickChannels(s, 60_000);
    expect(s.containers.length).toBe(CHANNEL.receiptsContainerCap + 3);
  });
});

describe("reveal", () => {
  test("auto-advances stages over time", () => {
    const s = createState(42, 0);
    const c = spawnContainer(s, "receipts");
    const uncorrupted = c.fragments.find((f) => !f.corrupted);
    if (!uncorrupted) return;
    tickReveal(s, REVEAL.stageAdvanceMs);
    expect(uncorrupted.stage).toBe(1);
    tickReveal(s, REVEAL.stageAdvanceMs * 3);
    expect(uncorrupted.stage).toBe(3);
  });

  test("manual advance charges Compute per stage", () => {
    const s = createState(42, 0);
    const c = spawnContainer(s, "receipts");
    const uncorrupted = c.fragments.find((f) => !f.corrupted);
    if (!uncorrupted) return;
    const before = s.compute;
    expect(advanceReveal(s, uncorrupted.id)).toBe(true);
    expect(s.compute).toBe(before - REVEAL.costPerManualStage[0]);
    expect(uncorrupted.stage).toBe(1);
  });

  test("manual advance fails when Compute is insufficient", () => {
    const s = createState(42, 0);
    const c = spawnContainer(s, "receipts");
    const uncorrupted = c.fragments.find((f) => !f.corrupted);
    if (!uncorrupted) return;
    s.compute = 0;
    expect(advanceReveal(s, uncorrupted.id)).toBe(false);
    expect(uncorrupted.stage).toBe(0);
  });

  test("corrupted fragments do not auto-reveal", () => {
    const s = createState(42, 0);
    const c = spawnContainer(s, "receipts");
    const corrupted = c.fragments.find((f) => f.corrupted);
    if (!corrupted) return;
    tickReveal(s, REVEAL.stageAdvanceMs * 10);
    expect(corrupted.stage).toBe(0);
  });
});

describe("extraction", () => {
  test("stage-3 fragments move to the pool and empty containers are cleared", () => {
    const s = createState(42, 0);
    const c = spawnContainer(s, "receipts");
    for (const f of c.fragments) {
      if (!f.corrupted) f.stage = 3;
      else f.resolved = true;
    }
    collectExtracted(s);
    expect(s.pool.length).toBeGreaterThan(0);
    expect(s.containers.length).toBe(0);
  });
});

describe("corrupted fields", () => {
  test("restoration charges Compute and clears corrupted flag on success", () => {
    const s = createState(7, 0);
    const c = spawnContainer(s, "receipts");
    const corrupted = c.fragments.find((f) => f.corrupted);
    if (!corrupted) return;
    s.compute = 100;
    restoreCorrupted(s, corrupted.id);
    expect(s.compute).toBe(100 - REVEAL.corruptionRestoreCost);
  });

  test("discard marks the fragment resolved", () => {
    const s = createState(1, 0);
    const c = spawnContainer(s, "receipts");
    const f = c.fragments[0];
    if (!f) return;
    expect(discardFragment(s, f.id)).toBe(true);
    expect(f.resolved).toBe(true);
  });
});
