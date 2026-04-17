# Residue — stages 2–5 draft

Four new stages, with branching at 2 and 3. Drafted 2026-04-17. Status: design exploration, not committed.

Design constraint: like Universal Paperclips, each stage swaps the dominant *interaction metaphor*, not just the numbers. Branches (2A/B, 3A/B) are player-chosen at unlock and persist in `state.stageBranch: "A" | "B"`.

---

## Stage 2 — Inference Layer *(branch)*

**Unlock:** 1 Full File profile + 2000 DP total generated.

### 2A — Correlation Desk
*"A supervisor has asked you to map relationships."*

- **New channel:** Overheard transcripts (relationship, schedule fragment, venue).
- **New interaction: token-drag link.** Fragments render as cards with highlighted tokens. Drag a token from one card onto a matching token on another to forge a profile link manually. A correct match (name+employer, phone frag+venue) emits a DP burst; a false match raises Suspicion — the compliance module notices you claimed a connection that didn't hold.
- **New resource: Correlation Heat.** Fills with successful links. At threshold, unlocks a *synthetic profile* — assembled from fragments that never carried a strong identity field.
- **Upgrades:** `tokenHighlighter` (auto-glow strong matches → auto-suggest → auto-link), `relationshipMap` (linked profiles share fields for DP purposes), `falseMatchTolerance` (reduce suspicion gain on mismatches).
- **Tone shift:** the word "subject" appears. The first named-person portrait placeholder shows up on the highest-correlation profile.

### 2B — Scheduler's Lens
*"Inference priority shifted: when, not who."*

- **New channel:** EXIF metadata (GPS, device, timestamp).
- **New interaction: routine grid.** A 24×7 calendar fills with dots as EXIF fragments extract. Click a cluster to "confirm" a routine — promotes it to a solid marker attached to a profile whose name the player has never seen. Confirming a false cluster (stray points) wastes Compute and raises Suspicion mildly.
- **New resource: Predictions Pending.** A counter of predicted events. When matching fragments arrive at the predicted time, they arrive *pre-revealed* — no Compute cost, a DP multiplier.
- **Upgrades:** `densityThreshold` (lower dots needed to confirm), `predictiveFlag` (flag a profile → scheduled fragment burst), `exifAutoPin` (periodic auto-confirmation of obvious clusters).
- **Tone shift:** the task list disappears. Logs gain timestamps in a second, colder font.

---

## Stage 3 — Ambient Collection *(branch)*

**Unlock:** 10 profiles of at least Portrait tier + branch-specific prerequisite (2A → `relationshipMap` lvl 2; 2B → `predictiveFlag` used 3 times).

### 3A — Acoustic Sweep
*Branding gone. Cursor blink replaces wordmark.*

- **New channel:** Ambient audio logs (voice ID, keyword clusters, emotional inflection).
- **New interaction: spectrogram tap.** A scrolling waveform. Tap when the cursor crosses a band matching a prior voiceprint — a keyword bubbles up and attaches to a profile. Timing-based; near-misses still land but at reduced value.
- **New resource: Cadence bonus.** Consecutive hits stack a DP multiplier; a miss resets it. The first reward structure in the game that punishes being greedy *within a single session* rather than across ticks.
- **New event: Compliance Sweep.** Triggered by rapid-fire taps — briefly disables the audio channel and desaturates the UI. Introduces an active-skill suspicion pressure distinct from the existing passive decay.
- **Upgrades:** `voiceprintLibrary` (auto-attach bands), `cadenceFloor` (miss doesn't fully reset), `sweepMute` (reduce compliance-sweep cooldown).

### 3B — Document Bleed
*"The paperwork has begun leaking through."*

- **New channel:** Uploaded document backgrounds (letterheads, redacted forms, partial addresses).
- **New interaction: redaction reveal.** Documents arrive with black bars. Each bar is clickable; Compute un-redacts one. Some hide gold (account numbers, full addresses); others hide nothing — wasted Compute. Templates repeat, so pattern recognition rewards careful play.
- **New resource: Template Confidence** (per template, 0–100). High confidence auto-hides the junk bars; low confidence shows every bar, indistinguishable.
- **New event: Legal Review.** Periodic modal: drag up to 3 documents into an archive panel or eat a Suspicion spike. First *active defensive* interaction in the game.
- **Upgrades:** `templateLibrary` (start confidence above zero on recognized forms), `autoArchive` (auto-feed Legal Review), `redactionOracle` (permanent marker on profit bars).

---

## Stage 4 — The Portrait *(convergent)*

**Unlock:** either Stage 3 branch completed + 50 Full File profiles.

*"You have no further tasks."*

- **New channel:** Cross-app inference — passive, synthesizes fragments from existing profile content. No player action, arrives as a trickle.
- **New interaction: portrait canvas.** Each complete profile gains a face grid. Drag image-shard fragments (EXIF thumbnails, voice-inferred descriptors) onto the grid; snap-to-align. Completeness multiplies that profile's DP. The faces are generative — deliberately uncanny, not photoreal.
- **New interaction: objectives panel.** Replaces the old upgrade list's top slot. Objectives arrive *unattributed* — no more "Harlow & Sable." Completing one nudges the tone further; ignoring them is allowed.
- **New upgrade tree: Agency projects.** No more automation-for-convenience. Each project spends DP to remove a player interaction entirely — auto-portrait-assembly, auto-objective-acceptance, auto-channel-unlock. Every purchase trades control for throughput.
- **Hidden resource: Mandate Variance.** Never shown numerically. Drives micro-mutations — log colors, cursor blink rate, title-bar text decay.

---

## Stage 5 — Continuation *(perpetual; no design change, only stripping)*

Optional terminal stage. UI at 80% opacity except log. The only surviving control is a **Halt** button. Not clicking it lets the game continue escalating forever; numbers rise, new tiers beyond Full File appear ("Archetype," "Shade"). A Persistence counter tracks non-halts and unlocks self-referential log entries — profiles the game has quietly constructed from the player.

---

## Interaction diversity summary

| Stage | Core interaction | Novel element |
|---|---|---|
| 2A | Drag-to-link tokens | First direct inter-fragment manipulation |
| 2B | Click-to-confirm calendar dots | Pattern-over-time recognition |
| 3A | Spectrogram timing taps | Skill/rhythm; multiplier chain |
| 3B | Un-redact bars + Legal Review archive | Informed-choice extraction + active defense |
| 4 | Portrait assembly + objectives panel | Spatial composition + narrative agency trade |
| 5 | Halt / persist | Deliberate removal of agency |

---

## Module shape (keeps one-concept-per-file)

Data:
- `data/branchConfig.ts` — branch definitions, unlock prerequisites per branch
- `data/lootPools.ts` — new channels appended
- `data/upgradeTree.ts` — new rows; new `AgencyProject` type at stage 4

Engine (new modules, each with sibling test):
- `engine/correlation.ts` — token-link resolution + Correlation Heat
- `engine/routineGrid.ts` — dot clustering + routine confirmation
- `engine/acoustic.ts` — band timing, cadence multiplier, sweep event
- `engine/redaction.ts` — bar states, template confidence, Legal Review queue
- `engine/portrait.ts` — canvas completeness scoring
- `engine/objectives.ts` — unattributed objective queue + Mandate Variance

UI: one new panel per stage, lazy-loaded on unlock. Existing `toneController.ts` absorbs the new tone triggers; no UI rewrite required.
