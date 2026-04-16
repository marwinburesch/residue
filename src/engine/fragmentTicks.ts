import { CHANNEL, REVEAL } from "../data/tuning.ts";
import type { ChannelId } from "../data/lootPools.ts";
import type { Container, GameState, RevealStage } from "./state.ts";
import {
	autoExtractCooldownMs,
	autoProcessCooldownMs,
	autoRestoreCooldownMs,
} from "./upgrades.ts";
import { fireMilestone } from "./milestones.ts";
import {
	extractContainer,
	isFragmentProcessable,
	restoreCorrupted,
	spawnContainer,
	startProcessing,
} from "./containerLifecycle.ts";

export function tickChannels(state: GameState, dtMs: number): void {
	const cap = CHANNEL.receiptsContainerCap;
	for (const id of Object.keys(state.channels) as ChannelId[]) {
		const rt = state.channels[id];
		if (!rt) continue;
		rt.spawnAccumulator += (dtMs / 1000) * CHANNEL.receiptsSpawnPerSecond;
		while (rt.spawnAccumulator >= 1 && state.containers.length < cap) {
			rt.spawnAccumulator -= 1;
			spawnContainer(state, id);
		}
		if (rt.spawnAccumulator > 1 && state.containers.length >= cap) {
			rt.spawnAccumulator = 1;
		}
	}
}

export function tickReveal(state: GameState, dtMs: number): void {
	for (const container of state.containers) {
		for (const f of container.fragments) {
			if (f.resolved || f.corrupted || !f.processing) continue;
			if (f.stage === 3) continue;
			f.stageTimer += dtMs;
			while (f.stageTimer >= REVEAL.stageAdvanceMs && f.stage < 3) {
				f.stageTimer -= REVEAL.stageAdvanceMs;
				f.stage = (f.stage + 1) as RevealStage;
				if (f.stage === 3) {
					f.stageTimer = 0;
					f.processing = false;
					fireMilestone(state, "firstFragmentOpened");
				}
			}
		}
	}
}

function isContainerClean(container: Container): boolean {
	let any = false;
	for (const f of container.fragments) {
		if (f.resolved) continue;
		if (f.corrupted) return false;
		if (f.stage < 3) return false;
		any = true;
	}
	return any;
}

export function tickAutoExtract(state: GameState, dtMs: number): void {
	const cooldown = autoExtractCooldownMs(state);
	if (cooldown === null) return;
	state.autoExtractTimer += dtMs;
	if (state.autoExtractTimer < cooldown) return;
	state.autoExtractTimer = 0;
	const clean = state.containers.find(isContainerClean);
	if (clean) extractContainer(state, clean.id);
}

export function tickAutoRestore(state: GameState, dtMs: number): void {
	const cooldown = autoRestoreCooldownMs(state);
	if (cooldown === null) return;
	state.autoRestoreTimer += dtMs;
	if (state.autoRestoreTimer < cooldown) return;
	state.autoRestoreTimer = 0;
	for (const c of state.containers) {
		const target = c.fragments.find((f) => f.corrupted && !f.resolved);
		if (target) {
			restoreCorrupted(state, target.id);
			return;
		}
	}
}

export function tickAutoProcess(state: GameState, dtMs: number): void {
	const cooldown = autoProcessCooldownMs(state);
	if (cooldown === null) return;
	state.processAutoTimer += dtMs;
	if (state.processAutoTimer < cooldown) return;
	state.processAutoTimer = 0;
	for (const c of state.containers) {
		for (const f of c.fragments) {
			if (!isFragmentProcessable(f)) continue;
			if (startProcessing(state, f.id)) return;
			return;
		}
	}
}
