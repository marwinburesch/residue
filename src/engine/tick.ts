import type { GameState } from "./state.ts";
import { regenCompute } from "./resources.ts";
import { drainExtracted } from "./containerLifecycle.ts";
import {
	tickAutoExtract,
	tickAutoProcess,
	tickAutoRestore,
	tickChannels,
	tickReveal,
} from "./fragmentTicks.ts";
import { ingestBatch, tickProfileDp } from "./profiles.ts";
import { tickSuspicion } from "./suspicion.ts";
import { advanceStageIfReady } from "./stages.ts";

export function step(state: GameState, dtMs: number): void {
	if (dtMs <= 0) return;
	if (state.pendingStageTransition !== null) return;
	state.now += dtMs;
	regenCompute(state, dtMs);
	tickChannels(state, dtMs);
	tickReveal(state, dtMs);
	tickAutoProcess(state, dtMs);
	tickAutoExtract(state, dtMs);
	tickAutoRestore(state, dtMs);
	for (const batch of drainExtracted(state)) ingestBatch(state, batch);
	tickProfileDp(state, dtMs);
	tickSuspicion(state, dtMs);
	advanceStageIfReady(state);
}
