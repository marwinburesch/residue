import { describe, expect, test } from "bun:test";
import { createState } from "./state.ts";
import type { ExtractedField } from "./state.ts";
import { ingestBatch, tickProfileDp } from "./profiles.ts";
import { DP, PROFILE } from "../data/tuning.ts";

function field(
  id: number,
  kind: ExtractedField["kind"],
  value: string,
): ExtractedField {
  return { id, channel: "receipts", kind, value, corrupted: false, extractedAt: 0 };
}

describe("profile matching", () => {
  test("creates a new profile when no identity matches", () => {
    const s = createState(1, 0);
    ingestBatch(s, [field(1, "name", "T. Marlow"), field(2, "postcode", "E17 4QL")]);
    expect(s.profiles.length).toBe(1);
    expect(s.profiles[0]!.fields.name).toBe("T. Marlow");
  });

  test("merges into existing profile on name match", () => {
    const s = createState(1, 0);
    ingestBatch(s, [field(1, "name", "T. Marlow"), field(2, "postcode", "E17 4QL")]);
    ingestBatch(s, [field(3, "name", "T. Marlow"), field(4, "loyaltyId", "LY-1")]);
    expect(s.profiles.length).toBe(1);
    expect(s.profiles[0]!.fields.loyaltyId).toBe("LY-1");
  });

  test("merges into existing profile on loyaltyId match", () => {
    const s = createState(1, 0);
    ingestBatch(s, [field(1, "loyaltyId", "LY-7"), field(2, "purchaseItem", "x")]);
    ingestBatch(s, [field(3, "loyaltyId", "LY-7"), field(4, "name", "R. Osei")]);
    expect(s.profiles.length).toBe(1);
    expect(s.profiles[0]!.fields.name).toBe("R. Osei");
  });

  test("promotes ghost to outline once field threshold is reached", () => {
    const s = createState(1, 0);
    ingestBatch(s, [
      field(1, "name", "S. Devlin"),
      field(2, "postcode", "N1 3BD"),
      field(3, "loyaltyId", "LY-22806"),
    ]);
    expect(s.profiles[0]!.tier).toBe("outline");
    expect(Object.keys(s.profiles[0]!.fields).length).toBeGreaterThanOrEqual(
      PROFILE.outlineFieldThreshold,
    );
  });
});

describe("profile DP accrual", () => {
  test("outline profiles accrue faster than ghosts", () => {
    const ghost = createState(1, 0);
    ingestBatch(ghost, [field(1, "name", "T. Marlow")]);
    tickProfileDp(ghost, 1000);

    const outline = createState(1, 0);
    ingestBatch(outline, [
      field(2, "name", "T. Marlow"),
      field(3, "postcode", "E17 4QL"),
      field(4, "loyaltyId", "LY-1"),
    ]);
    tickProfileDp(outline, 1000);

    expect(outline.dp).toBeGreaterThan(ghost.dp);
    expect(ghost.dp).toBeCloseTo(DP.perFieldPerSecondGhost * 1, 5);
  });
});
