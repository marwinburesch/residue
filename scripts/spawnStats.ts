import { RARITY, RARITY_TIERS } from "../src/data/tuning.ts";
import type { Rarity } from "../src/data/tuning.ts";
import { spawnContainer } from "../src/engine/fragments.ts";
import { createState } from "../src/engine/state.ts";
import type { FieldKind } from "../src/data/lootPools.ts";

const N = Number(process.argv[2] ?? 10_000);
const seed = Number(process.argv[3] ?? Date.now() & 0xffffffff);

const state = createState(seed, 0);

const rarityCount: Record<Rarity, number> = {
  common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0,
};
const fieldCountByRarity: Record<Rarity, number[]> = {
  common: [], uncommon: [], rare: [], epic: [], legendary: [], mythic: [],
};
const kindCount: Partial<Record<FieldKind, number>> = {};
let coherentChecked = 0;
let coherentMismatches = 0;
let emailInCommon = 0;

for (let i = 0; i < N; i++) {
  const c = spawnContainer(state, "receipts");
  rarityCount[c.rarity]++;
  fieldCountByRarity[c.rarity].push(c.fragments.length);

  const fieldsByKind: Partial<Record<FieldKind, string>> = {};
  for (const f of c.fragments) {
    kindCount[f.kind] = (kindCount[f.kind] ?? 0) + 1;
    fieldsByKind[f.kind] ??= f.value;
  }

  if (c.rarity === "common" && fieldsByKind.email) emailInCommon++;

  // Coherence check: for uncommon+, all person-linked fields in the container
  // should come from the SAME person record.
  const coherentFromIdx = RARITY_TIERS.indexOf(RARITY.coherentFrom);
  if (RARITY_TIERS.indexOf(c.rarity) >= coherentFromIdx) {
    coherentChecked++;
    const { people } = await import("../src/data/people.ts");
    const name = fieldsByKind.name;
    const email = fieldsByKind.email;
    if (name && email) {
      const person = people.find((p) => p.name === name);
      if (!person || person.email !== email) coherentMismatches++;
    }
  }

  // drop container so state doesn't grow unbounded
  state.containers.length = 0;
}

function pct(n: number, d: number): string {
  return d === 0 ? "—" : `${((n / d) * 100).toFixed(3)}%`;
}
function avg(xs: number[]): string {
  if (xs.length === 0) return "—";
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const mn = Math.min(...xs);
  const mx = Math.max(...xs);
  return `${m.toFixed(2)} (min ${mn}, max ${mx})`;
}

console.log(`\n== Spawn stats — N=${N}, seed=${seed} ==\n`);
console.log("Rarity distribution (actual vs expected):");
const totalWeight = RARITY_TIERS.reduce((a, r) => a + RARITY.weights[r], 0);
for (const r of RARITY_TIERS) {
  const actual = pct(rarityCount[r], N);
  const expected = pct(RARITY.weights[r], totalWeight);
  console.log(`  ${r.padEnd(10)} ${String(rarityCount[r]).padStart(6)}  ${actual.padStart(9)}  (expected ${expected})`);
}

console.log("\nField count per container, by rarity:");
for (const r of RARITY_TIERS) {
  console.log(`  ${r.padEnd(10)} ${avg(fieldCountByRarity[r])}`);
}

console.log("\nField kind totals:");
const kinds = Object.keys(kindCount).sort() as FieldKind[];
const totalFields = kinds.reduce((a, k) => a + (kindCount[k] ?? 0), 0);
for (const k of kinds) {
  console.log(`  ${k.padEnd(14)} ${String(kindCount[k]).padStart(6)}  ${pct(kindCount[k]!, totalFields)}`);
}

console.log("\nCoherence checks:");
console.log(`  name+email pairs checked: ${coherentChecked}`);
console.log(`  name→email mismatches:    ${coherentMismatches}  (should be 0)`);
console.log(`  emails in common rarity:  ${emailInCommon}  (should be 0)`);
console.log();
