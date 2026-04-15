# Vertical slice roadmap — Residue

## Context

The core Stage 0 loop (one channel, fragment reveal, ghost/outline profiles, upgrades, suspicion, save/load) is playable but arrives cold: the game boots directly into mechanics with no framing, no sense of escalation, and nowhere to go once the first channel feels exhausted. A vertical slice needs to show the *arc* — not just the loop. That means a sterile beginning, a first visible crack in the facade, and enough novelty to prove the tone-drift thesis.

Target: a 20–30 minute first session that ends on "wait… what is this game actually about?"

## Proposed scope (Stage 0 → Stage 1)

### 1. Start screen / boot sequence
- Single-screen framing as a corporate OCR tool ("Harlow & Sable Accounting — Expense Digitisation Service").
- One action: `[ Begin shift ]`. On existing save, reads `[ Resume shift ]` + last-session summary.
- Brief fake-boot log lines (3–5) printing line-by-line to set sterile tone before the UI appears.
- New file: `src/ui/bootScreen.ts`. Narrative strings in `src/data/narrative.ts`.

### 2. Narrative log beats (milestone-driven)
- Extend `src/ui/log.ts` to emit scripted lines at milestones, not just mechanical events.
- Beats: first fragment opened, first corrupted field, 5th profile ("Field extraction → Entity extraction" rename per design §tone-drift), first Outline, Stage 1 unlock.
- Script lives in `src/data/narrative.ts`; engine emits milestone events from `src/engine/profiles.ts` / `fragments.ts`; UI listens and writes to log.

### 3. Stage system + Stage 1 transition
- New `src/data/stageConfig.ts`: stage metadata + unlock condition.
- **Unlock gate for the slice** (composite, thematic): `N Outline profiles` (~15–20) **AND** `K DP spent` (e.g. 300) **AND** a **hardware tier** reached on the upgrade tree. The machine physically grows before it escalates — the player feels they *earned* the next channel by enlarging the rig, not by idling.
- New `src/engine/stages.ts` (+ test): pure stage-advance reducer. Reads GameState, returns new stage when all conditions met. No DOM.
- Persistence: add `stage` field to save blob (`src/engine/persistence.ts`).
- UI: `src/ui/toneController.ts` applies CSS class mutations per stage.

### 3a. Hardware-tier upgrade track (new)
- Extend `src/data/upgradeTree.ts` with a **"machine"** track alongside the existing compute/auto upgrades: `CPU upgrade → Expansion slot → Co-processor` (names TBD). Each raises max Compute and/or regen, with escalating DP cost.
- Gate for Stage 1 = "Expansion slot" (tier 2) purchased. Ties the narrative of the OCR tool *growing into something more* to concrete player agency.
- UI: upgrade panel already supports chained upgrades — reuse. Optionally show a tiny "rig" visual later; not in this slice.
- Purely additive to `data/` + one field on GameState tracking purchased tier (may already exist via `upgrades.ts`; reuse if so).

### 4. Second channel: corkboard notes
- Extend `src/data/lootPools.ts` with `corkboard` pool (name, phone fragment, employer, room number).
- Spawn logic in `src/engine/fragments.ts` reads active channels from GameState; channel becomes active on Stage 1 unlock.
- UI surfaces a second source in the fragment browser — previously the source label was implicit with only receipts.

### 5. Tone drift — first visible shifts
Two or three cheap-but-evocative changes at Stage 1, per design §tone-drift:
- Log gains a monospace font for system lines.
- One label renames ("load" → "suspicion", or "Field extraction" → "Entity extraction").
- Subtle background shift (off-white) or header weight change.
All driven by body-level CSS classes toggled by `toneController.ts`. No per-component rewrites.

### 6. Ambient audio stub
- Minimal Web Audio drone (single oscillator + lowpass) in `src/ui/audio.ts`.
- Starts silent until user gesture (browser policy); fades in after boot screen.
- Pitch shifts ~2 semitones down on Stage 1. Proves the pipeline; real sound design later.

## Critical files

- New: `src/data/narrative.ts`, `src/data/stageConfig.ts`, `src/engine/stages.ts` (+ test), `src/ui/bootScreen.ts`, `src/ui/toneController.ts`, `src/ui/audio.ts`.
- Modified: `src/data/lootPools.ts` (+corkboard), `src/data/upgradeTree.ts` (+machine track), `src/engine/fragments.ts` (channel-aware spawn), `src/engine/persistence.ts` (stage field), `src/ui/log.ts` (milestone hook), `src/main.ts` (boot screen gate + audio init).

## Verification

- `bun test` — new `stages.test.ts` covers unlock conditions; existing engine tests stay green.
- Manual: fresh save → boot screen → receipts-only play → hit unlock threshold → Stage 1 log line + corkboard channel appears + tone shift + audio pitch drop. Reload mid-Stage-1 → state persists.
- Regression: existing save file loads (stage defaults to 0 if absent).

## Decisions (confirmed)

- Scope: Stage 0 → Stage 1 including audio stub.
- Boot screen: fake-boot terminal printing sterile log lines.
- Unlock gate: composite — Outline count + DP spent + hardware-tier upgrade purchased (see §3a). Thematically ties Stage 1 to the OCR rig physically growing.
