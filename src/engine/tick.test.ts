import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import { step } from "./tick.ts";

describe("tick", () => {
  test("advances simulated time", () => {
    const s = createState(1, 1000);
    step(s, 250);
    expect(s.now).toBe(1250);
  });

  test("ignores non-positive deltas", () => {
    const s = createState(1, 1000);
    step(s, 0);
    step(s, -10);
    expect(s.now).toBe(1000);
  });
});
