import { RARITY, RARITY_TIERS, REVEAL } from "../data/tuning.ts";
import type { Rarity } from "../data/tuning.ts";
import { channels as channelDefs } from "../data/lootPools.ts";
import type { ChannelId, FieldDef, FieldKind } from "../data/lootPools.ts";
import { people } from "../data/people.ts";
import type { Person } from "../data/people.ts";
import { pick, pickWeighted, createRng } from "./rng.ts";
import type { Rng } from "./rng.ts";
import {
	logInfo,
	nextId,
	type Container,
	type ExtractedField,
	type Fragment,
	type GameState,
} from "./state.ts";
import { spendCompute } from "./resources.ts";
import { recordAction } from "./suspicion.ts";
import { fireMilestone } from "./milestones.ts";
import { totalProcessCost } from "./upgrades.ts";

function rngFor(state: GameState, tag: number): Rng {
	return createRng(state.rngSeed ^ tag);
}

function rollRarity(rng: Rng): Rarity {
	const entries = RARITY_TIERS.map((r) => ({
		rarity: r,
		weight: RARITY.weights[r],
	}));
	return pickWeighted(rng, entries).rarity;
}

function isCoherent(rarity: Rarity): boolean {
	return (
		RARITY_TIERS.indexOf(rarity) >= RARITY_TIERS.indexOf(RARITY.coherentFrom)
	);
}

function personValueFor(kind: FieldKind, person: Person): string | null {
	switch (kind) {
		case "name":
			return person.name;
		case "email":
			return person.email;
		case "postcode":
			return person.postcode;
		case "loyaltyId":
			return person.loyaltyId;
		case "paymentLast4":
			return person.paymentLast4;
		default:
			return null;
	}
}

function fieldValue(
	rng: Rng,
	def: FieldDef,
	person: Person | null,
): string | null {
	if (person) {
		const v = personValueFor(def.kind, person);
		if (v !== null) return v;
	}
	if (def.requiresPerson) return null;
	if (def.samples.length === 0) return null;
	return pick(rng, def.samples);
}

function findFragment(state: GameState, id: number): Fragment | undefined {
	for (const c of state.containers) {
		const f = c.fragments.find((x) => x.id === id);
		if (f) return f;
	}
	return undefined;
}

export function spawnContainer(
	state: GameState,
	channel: ChannelId,
): Container {
	const def = channelDefs[channel];
	const rng = rngFor(state, state.nextId * 2654435761);
	const rarity = rollRarity(rng);
	const person = isCoherent(rarity) ? pick(rng, people) : null;

	const eligiblePool = def.pool.filter(
		(p) => !p.requiresPerson || person !== null,
	);
	const [min, max] = RARITY.fields[rarity];
	const maxUnique =
		eligiblePool.filter((p) => !p.allowMultiple).length +
		(eligiblePool.some((p) => p.allowMultiple) ? Infinity : 0);
	const target = min + Math.floor(rng() * (max - min + 1));
	const count = Math.min(target, maxUnique);

	const fragments: Fragment[] = [];
	const usedKinds = new Set<string>();
	for (let i = 0; i < count; i++) {
		const remaining = eligiblePool.filter((p) => !usedKinds.has(p.kind));
		if (remaining.length === 0) break;
		const fieldDef = pickWeighted(rng, remaining);
		if (!fieldDef.allowMultiple) usedKinds.add(fieldDef.kind);
		const value = fieldValue(rng, fieldDef, person);
		if (value === null) continue;
		const corrupted = rng() < REVEAL.corruptionChance;
		if (corrupted) fireMilestone(state, "firstCorruptedField");
		fragments.push({
			id: nextId(state),
			kind: fieldDef.kind,
			label: fieldDef.label,
			value,
			stage: 0,
			stageTimer: 0,
			corrupted,
			resolved: false,
			processing: false,
		});
	}
	const container: Container = {
		id: nextId(state),
		channel,
		spawnedAt: state.now,
		rarity,
		fragments,
	};
	state.containers.push(container);
	return container;
}

export function startProcessing(
	state: GameState,
	fragmentId: number,
): boolean {
	const fragment = findFragment(state, fragmentId);
	if (!fragment || fragment.resolved || fragment.corrupted) return false;
	if (fragment.processing || fragment.stage >= 3) return false;
	const cost = totalProcessCost(state, fragment.stage as 0 | 1 | 2);
	if (!spendCompute(state, cost)) return false;
	fragment.processing = true;
	fragment.stageTimer = 0;
	recordAction(state);
	return true;
}

export function processAllInContainer(
	state: GameState,
	containerId: number,
): number {
	const container = state.containers.find((c) => c.id === containerId);
	if (!container) return 0;
	let started = 0;
	for (const f of container.fragments) {
		if (f.resolved || f.corrupted || f.processing || f.stage >= 3) continue;
		if (!startProcessing(state, f.id)) break;
		started++;
	}
	return started;
}

export function isContainerReady(container: Container): boolean {
	let hasReady = false;
	for (const f of container.fragments) {
		if (f.resolved || f.corrupted) continue;
		if (f.stage < 3) return false;
		hasReady = true;
	}
	return hasReady;
}

export function extractContainer(
	state: GameState,
	containerId: number,
): boolean {
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

export function extractAllReady(state: GameState): number {
	const snapshot = [...state.containers];
	let count = 0;
	for (const c of snapshot) {
		if (isContainerReady(c) && extractContainer(state, c.id)) count++;
	}
	return count;
}

export function restoreCorrupted(
	state: GameState,
	fragmentId: number,
): boolean {
	const fragment = findFragment(state, fragmentId);
	if (!fragment || !fragment.corrupted || fragment.resolved) return false;
	if (!spendCompute(state, REVEAL.corruptionRestoreCost)) return false;
	state.rngSeed = (state.rngSeed + 0x9e3779b1) >>> 0;
	const rng = rngFor(state, fragment.id);
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

export function drainExtracted(state: GameState): ExtractedField[][] {
	if (state.pendingExtractions.length === 0) return [];
	const batches = state.pendingExtractions;
	state.pendingExtractions = [];
	return batches;
}
