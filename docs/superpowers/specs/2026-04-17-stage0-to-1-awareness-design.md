# Stage transition awareness — design

**Date:** 2026-04-17
**Status:** Draft (approved, ready for plan)
**Scope:** Make the stage 0 → 1 advancement legible to the player. Generalize so later stages opt in (or stay "sublime" by opting out).

---

## Problem

Today, when the unlock conditions for stage 1 are met, the engine silently advances `state.stage`, fires a single `[SIGNAL]` log line (`Rig expansion online…`), swaps the subtitle to "Entity Extraction", and nudges CSS via `body[data-tone-stage="1"]`. The corkboard channel is added without callout.

The pillar "keep players in the dark" is about *what's coming* — not about *what just happened*. The current implementation underplays the "something just changed" moment to the point that players can miss it entirely. Stage 1 is the game's first capability expansion; they should register it.

## Goal

A clear, unambiguous "something just happened" beat on stage advance. Data-driven per stage, **optional per stage** (stages that should drift silently — e.g. the design doc's Stage 3 "No system message" — omit the overlay content and the existing silent-advance path takes over).

## Non-goals

- Telegraphing *upcoming* stages or showing progress toward them. (Preserves the "in the dark" pillar.)
- Redesigning the unlock gates themselves (15 outline profiles / 300 DP spent / machineTier 2 stand).
- Changing existing tone-drift behaviour (subtitle swap, CSS data-attribute).
- UI tests (per project rule, UI is exercised manually).

---

## Design

A blocking overlay fires on stage advance, with contents authored per stage in `data/stageConfig.ts`. The engine pauses ticking while the overlay is pending. Dismissal is player-driven (click / Enter / Space).

### Data

Extend `StageDef` in `src/data/stageConfig.ts`:

```ts
export type StageTransition = {
  title: string;
  lines: readonly string[];
  dismissLabel: string;
};

export type StageDef = {
  id: StageId;
  label: string;
  unlock: StageUnlock | null;
  transition?: StageTransition;
};
```

Stage 0 has no `transition` (never advanced *into*). Stage 1 gets one. Future stages author theirs or omit for a silent drift.

**Stage 1 content** (revisable — shape, not copy, is the commitment):

- `title`: `Rig expansion online`
- `lines`:
  - `[SIGNAL] Secondary channel requisitioned.`
  - `mounting channel: corkboard ............ ok`
  - `profile engine: entity resolution ...... ok`
  - `subtitle reclassified → Entity Extraction`
  - `operator did not ask why.`
- `dismissLabel`: `[ Resume shift ]`

### Engine

**New state field** in `src/engine/state.ts`:

```ts
pendingStageTransition: StageId | null; // defaults null; serialized
```

**Queue on advance** — in `src/engine/stages.ts`, `advanceStageIfReady` continues to set `state.stage = next` and fire the existing `stage1Unlock` milestone (that log line is kept — it's the silent-advance trail for stages with no overlay). After that, if the new stage's `transition` is defined, set `state.pendingStageTransition = next`. If undefined, leave null — no overlay, stage drifts silently.

**Dismiss action** in `src/engine/stages.ts`:

```ts
export function acknowledgeStageTransition(state: GameState): void {
  state.pendingStageTransition = null;
}
```

**Pause while pending** — in `src/engine/tick.ts`, `step` early-returns when `state.pendingStageTransition !== null`:

```ts
export function step(state: GameState, dtMs: number): void {
  if (dtMs <= 0) return;
  if (state.pendingStageTransition !== null) return;
  state.now += dtMs;
  // …rest unchanged
}
```

`state.now` does not advance, so compute regen / reveals / suspicion decay all freeze. `gameLoop.ts` keeps calling `step` every tick, so its local `lastTick` advances normally; `dt` stays bounded and there is no fast-forward on dismiss. Autosave continues to run — the pending overlay survives reload.

**Persistence** — `pendingStageTransition` serializes with the rest of the save. Tab closed mid-overlay → overlay reappears after boot on next load. Fire-once for the log line continues to ride on `milestonesFired`; the overlay is edge-triggered by the pending field being set.

### Engine tests

`src/engine/stages.test.ts` additions:

- Advancing to a stage whose `transition` is defined sets `pendingStageTransition` to that stage id.
- Advancing to a stage whose `transition` is undefined leaves `pendingStageTransition` as null.
- `acknowledgeStageTransition` clears the field.

`src/engine/tick.test.ts` addition:

- `step` is a no-op when `pendingStageTransition !== null`: `state.now`, compute, suspicion, reveal timers unchanged.

`src/engine/persistence.test.ts` addition:

- `pendingStageTransition` round-trips through serialize/deserialize; missing field in an older save loads as null.

### UI

New module `src/ui/stageTransition.ts` with colocated `src/ui/stageTransition.css`.

**Render function:**

```ts
renderStageTransition(
  host: HTMLElement,
  state: GameState,
  onAcknowledge: () => void,
): void
```

Called every frame from the render loop in `src/ui/app.ts`, alongside `applyToneStage`. Idempotent:

- `state.pendingStageTransition === null` → remove any mounted overlay.
- Non-null and not yet mounted → mount once for that stage id.
- Non-null and already mounted for the same stage id → no-op.

**Structure:**

```html
<div class="stage-transition" role="dialog" aria-modal="true" aria-live="polite">
  <div class="stage-transition-inner">
    <h2 class="stage-transition-title">[title]</h2>
    <pre class="stage-transition-log"></pre>
    <button class="stage-transition-dismiss" disabled>[dismissLabel]</button>
  </div>
</div>
```

**Line sequencing** — lines append at `BOOT_LINE_MS` intervals (reuse the `narrative.ts` constant). Button enables and auto-focuses once the final line lands. `prefers-reduced-motion: reduce` → render all lines immediately and enable the button on mount.

**Dismissal** — click, Enter, or Space on the button fires `onAcknowledge`. The overlay fades via a `.stage-transition--leaving` class (200ms, matching boot screen).

**Wiring** (`src/ui/app.ts`):

Add `<div id="stage-transition-host"></div>` to the layout. In the render pass, after `applyToneStage`:

```ts
renderStageTransition(host, state, () => {
  acknowledgeStageTransition(state);
  save(state, Date.now());
});
```

Tone drift resolves visibly behind the dim overlay (the subtitle has already swapped, the CSS background tint has already applied) — dismissing the overlay is the reveal of the already-shifted world.

**Styling** (`src/ui/stageTransition.css`):

- Fixed full-viewport dim (`rgba(0,0,0,0.65)`), centred terminal-style inner card.
- Monospace, matching the log-panel font.
- Visually kin to `bootScreen.css` without sharing CSS (no cross-import; two components happen to look alike).

**Accessibility** — `role="dialog"`, `aria-modal`, `aria-live="polite"` for the log area, focus moves to the dismiss button on enable, Escape closes only once the button is enabled.

### UI — no unit tests

Per project rule; exercised manually.

---

## Architecture fit

- Dependency direction preserved: `data/stageConfig.ts` adds content, `engine/stages.ts` adds pure logic and exposes `acknowledgeStageTransition`, `ui/stageTransition.ts` is the only new DOM-toucher.
- One concept per file: the new UI module owns only the overlay. Engine changes stay within the existing `stages.ts` and a minimal addition to `tick.ts` / `state.ts`.
- No magic numbers introduced; line-sequence timing reuses `BOOT_LINE_MS` in `data/narrative.ts`.

---

## Player experience walkthrough

1. Player meets the unlock gate mid-session (e.g. finishes a 15th outline profile).
2. Tick runs, `advanceStageIfReady` flips `state.stage` to 1, fires the `stage1Unlock` log line, adds the corkboard channel, and sets `pendingStageTransition = 1`.
3. Next frame, the render loop:
   - `applyToneStage(1)` — subtitle and background shift now, visible only through the dim.
   - `renderStageTransition` mounts the overlay.
   - Engine `step` is a no-op this tick onward until dismiss; resource bar values are frozen.
4. Lines type in over ~1.2s. Dismiss button enables and auto-focuses.
5. Player presses Enter → overlay fades out; engine resumes; the corkboard channel is now visible and the world feels shifted.

If the player closes the tab between step 2 and step 5, they reopen to the boot screen, click through, and the overlay reappears as its own separate beat.

---

## Risks & mitigations

- **Overlay annoyance on reload if player does want to dismiss and move on** — button auto-focuses; Enter/Space close it; fade is 200ms. Three keystrokes of friction, intentional.
- **Frozen resource bar reads as a bug** — the stillness is intentional and reinforces "something just happened". If playtest shows confusion, add a one-line caption beneath resources (`system paused — awaiting acknowledgement`). Deferred.
- **Multiple tabs** — per existing persistence design, second tab sees "another session is active" and is read-only; pending overlay still visible, dismiss would do nothing in the read-only tab. Acceptable; no new work.
- **Authoring drift** — stage transition content lives in one file (`stageConfig.ts`) next to the unlock conditions; future stages' authors see it immediately.

---

## Out of scope (explicitly)

- Imminence cues ("you're close to stage 1") — excluded by the "in the dark" pillar.
- Pointer/highlight on the new corkboard channel after dismiss — considered and deferred; the overlay's own line about the channel is enough for now.
- Refactoring the tone controller to take its data from `stageConfig.ts` — nearby but orthogonal.
