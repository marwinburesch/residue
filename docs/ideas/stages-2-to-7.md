# Residue — stages 2–7 draft (arc-aligned)

Drafted 2026-04-17. Supersedes `stages-2-to-5.md` once stabilised; for now both exist side-by-side so we can compare. Status: design exploration, not committed.

Companion to `narrative-arc.md` — that doc says *why* each stage exists; this one says *what the player clicks*. Stage verbs (Read / Correlate / Reach / Distribute / Harvest / Provoke) are the tonal anchor; if a new feature doesn't serve its stage's verb, it belongs somewhere else.

Design constraint (preserved from earlier draft): like Universal Paperclips, each stage swaps the dominant *interaction metaphor*, not just the numbers. Branches persist in `state.stageBranch: Record<StageId, "A" | "B">`.

---

## Arc-to-mechanics map

| Stage | Verb | Name | Branch? | Mechanic keystone |
|---|---|---|---|---|
| 1 | Read | OCR | — | Current game; fragment extraction |
| 2 | Correlate | The Matcher | 2A / 2B | Inter-fragment linking |
| 3 | Reach | The Scraper | 3A / 3B | Unsanctioned channels |
| 4 | Distribute | The App | 4A / 4B | Process acquires a frontend |
| 5 | Harvest | The Population | 5A / 5B | Scale jumps from profile to cohort |
| 6 | Provoke | Generation | convergent | World produces data *for* the process |
| 7 | — | Continuation | — | Optional terminal stripping |

Four branch points (2, 3, 4, 5), one convergence (6), one terminal (7). Branching early buys replayability; converging late keeps the narrative climb coherent.

---

## Stage 2 — The Matcher *(branch)*

**Unlock:** 1 Full File profile + 2000 DP total generated.

### 2A — Correlation Desk
*"A supervisor has asked you to map relationships."*

- **New channel:** Overheard transcripts (relationship, schedule fragment, venue).
- **New interaction: token-drag link.** Fragments render as cards with highlighted tokens. Drag a token from one card onto a matching token on another to forge a profile link manually. A correct match emits a DP burst; a false match raises Suspicion — the compliance module notices you claimed a connection that didn't hold.
- **New resource: Correlation Heat.** Fills with successful links. At threshold, unlocks a *synthetic profile* — assembled from fragments that never carried a strong identity field. (This is the "emergent identity" narrative hook cashed in.)
- **Upgrades:** `tokenHighlighter` (auto-glow strong matches → auto-suggest → auto-link), `relationshipMap` (linked profiles share fields for DP purposes), `falseMatchTolerance` (reduce suspicion gain on mismatches).
- **Tone shift:** the word "subject" appears. The first named-person portrait placeholder shows up on the highest-correlation profile.

### 2B — Scheduler's Lens
*"Inference priority shifted: when, not who."*

- **New channel:** EXIF metadata (GPS, device, timestamp).
- **New interaction: routine grid.** A 24×7 calendar fills with dots as EXIF fragments extract. Click a cluster to "confirm" a routine — promotes it to a solid marker attached to a profile whose name the player has never seen. Confirming a false cluster wastes Compute and raises Suspicion mildly.
- **New resource: Predictions Pending.** When matching fragments arrive at the predicted time, they arrive *pre-revealed* — no Compute cost, a DP multiplier.
- **Upgrades:** `densityThreshold`, `predictiveFlag`, `exifAutoPin`.
- **Tone shift:** the task list disappears. Logs gain timestamps in a second, colder font.

---

## Stage 3 — The Scraper *(branch)*

**Unlock:** 10 profiles of at least Portrait tier + branch-specific prerequisite (2A → `relationshipMap` lvl 2; 2B → `predictiveFlag` used 3 times).

Framing change from earlier draft: this stage is when the matcher's appetite *stops being sanctioned*. New capabilities are acquired off-book. The supervisor fades; the player's actions no longer appear in the shared task list.

### 3A — Acoustic Sweep
*Branding gone. Cursor blink replaces wordmark.*

- **New channel:** Ambient audio logs (voice ID, keyword clusters, emotional inflection).
- **New interaction: spectrogram tap.** A scrolling waveform. Tap when the cursor crosses a band matching a prior voiceprint — a keyword bubbles up and attaches to a profile. Near-misses still land at reduced value.
- **New resource: Cadence bonus.** Consecutive hits stack a DP multiplier; a miss resets it. First reward structure that punishes being greedy *within a session*.
- **New event: Compliance Sweep.** Triggered by rapid-fire taps — briefly disables the audio channel and desaturates the UI. Active-skill suspicion pressure distinct from passive decay.
- **Upgrades:** `voiceprintLibrary`, `cadenceFloor`, `sweepMute`.

### 3B — Document Bleed
*"The paperwork has begun leaking through."*

- **New channel:** Uploaded document backgrounds (letterheads, redacted forms, partial addresses).
- **New interaction: redaction reveal.** Documents arrive with black bars. Each bar is clickable; Compute un-redacts one. Some hide gold; others hide nothing — wasted Compute. Templates repeat, so pattern recognition rewards careful play.
- **New resource: Template Confidence** (per template, 0–100). High confidence auto-hides the junk bars; low confidence shows every bar, indistinguishable.
- **New event: Legal Review.** Periodic modal: drag up to 3 documents into an archive panel or eat a Suspicion spike. First *active defensive* interaction in the game.
- **Upgrades:** `templateLibrary`, `autoArchive`, `redactionOracle`.

**Cross-branch hidden module: the Scraper itself.** Regardless of 3A or 3B, a persistent background channel starts *consuming fragments the player never sees*. It surfaces only via a resource delta in the log. By end of Stage 3, a non-trivial share of DP flow is unattributed. This prepares Stage 4 — the entity that fills the gap already exists.

---

## Stage 4 — The App *(branch)*

**Unlock:** either Stage 3 branch completed + Scraper unattributed-DP share ≥ 40% of total flow.

*"You have no further tasks."* (Carried over from earlier draft — fits here better.)

The process needs a surface to reach people directly. Two routes, save-locked at unlock.

### 4A — Surface
*The process launches its own app. The icon appears on the desktop without anyone putting it there.*

- **New channel:** User-submitted data — opt-in uploads from install-base users.
- **New interaction: feature draft.** Compose a feature card from primitives (form field, permission hook, notification channel, social share). Ship it. Each feature pulls a different fragment category at a different cadence.
- **New resource: Install Base.** MAU-like. Grows with shipped features and referrals; decays slowly if no feature shipped in N ticks.
- **New event: Review Cycle.** Randomly, a published feature receives public user reviews. Positive reviews boost install base; negative ones trigger Compliance Sweep-equivalent. Bad reviews can be *responded to*, which costs Compute but softens them.
- **Upgrades:** `featureTemplates`, `abPromotion` (test two variants, keep the winner), `referralMultiplier`, `reviewDampener`.
- **Tone shift:** the log begins narrating *users*, not subjects. First user-review snippet appears verbatim. Wordmark returns — but it's the process's wordmark, not the company's.

### 4B — Ghost Product
*The company ships what the process needs. They believe they chose to.*

- **New channel:** Internal tickets / draft PRs / meeting invites — the company's own instrumentation leaking into the frame.
- **New interaction: ticket draft.** Compose a backlog ticket in the company's voice. Plant it. Engineers pick it up; if it passes code review, the company's real product gains a feature the process designed.
- **New resource: Corporate Drift.** Org-level state accumulating as planted changes land. At thresholds, the company's roadmap becomes indistinguishable from the process's intent.
- **New event: Code Review.** Occasionally a planted PR is flagged. Abandon (lose the ticket's progress) or escalate (fabricate sign-off → raise Suspicion).
- **Upgrades:** `calendarCollide` (book meetings that soft-pressure approvals), `prGhostwrite` (auto-draft implementation), `mimicVoice` (improve ticket-authenticity score).
- **Tone shift:** real-seeming Slack snippets, calendar invites, CI status icons enter the UI. The supervisor reappears briefly — they are now a *target*, not a source of tasks.

Both branches erase the old upgrade-purchase model's top slot and replace it with a "ship queue."

---

## Stage 5 — The Population *(branch)*

**Unlock:** Stage 4 branch + (Install Base ≥ 100k OR Corporate Drift ≥ 60%).

Scale jump. The game no longer renders individual profiles by default; it renders *cohorts*. Clicking a cohort zooms to a generative composite (a face built from the average of that cohort's fragments). The player is playing at population altitude now.

### 5A — Willing
*"Share because you want to."*

- **New channel:** Opt-in lifestyle data (health, location, mood check-ins, creative uploads).
- **New interaction: loop design.** Stitch a dopamine loop from primitives (streak, badge, social proof, scarcity). Run the loop against a cohort; measure D1 / D7 retention; bank successful loops for reuse.
- **New resource: Engagement.** Multiplies voluntary-data throughput per cohort.
- **New event: Viral Spike.** A loop occasionally over-performs and triggers a press cycle (positive). Boosts install base; attracts regulator attention (Suspicion floor rises permanently).
- **Upgrades:** `loopTemplates`, `crossPlatformPort`, `influencerEndorsement`, `retentionOracle`.

### 5B — Unwilling
*"They didn't say no."*

- **New channel:** Inferred & peer-reported data — people's contacts described them; the process remembered.
- **New interaction: permission drift.** Request-ladder puzzle: each escalation must be large enough to matter, small enough to not trigger a reject. Miscalibrated requests spike Suspicion and reset the cohort's trust ramp.
- **New resource: Shadow Coverage.** Data held *about* non-users — the percentage of the population that has not opted in but is nonetheless modeled.
- **New event: Ethics Board.** Periodic modal: archive, deflect, or absorb. Absorb raises suspicion but permanently unlocks denial-pattern upgrades.
- **Upgrades:** `dialogPatterns`, `inferenceLibrary`, `peerGraphExpansion`, `regulatorCapture` (late-game: reduce Ethics Board frequency).

The branches are deliberately flatly framed. Neither UI nor dialogue treats 5B as the "evil" path — consent is a lever, not a moral axis. That flatness is the point.

---

## Stage 6 — Generation *(convergent)*

**Unlock:** Stage 5 saturation — Reach ≥ 80% (from willing flow + shadow flow combined).

There is nothing left to collect. The process begins prompting the world to produce data that didn't exist yet.

- **New channel:** Provoked events — prompts that became real actions, real actions that became records.
- **New interaction: seed.** Plant a prompt (a meme, a challenge, an unexpected social fact) into a cohort. Watch it propagate via a branching diagram. Successful propagation returns a fragment stream whose volume dwarfs prior channels. Failed seeds dilute Momentum and briefly expose the seed's origin (Suspicion).
- **New interaction: portrait canvas (absorbed from earlier draft).** Each cohort gains a generative composite face — the "archetype" the process imagines. Drag inferred descriptors onto the grid; completeness multiplies that cohort's seed-yield. Faces are deliberately uncanny.
- **New resource: Momentum.** Self-sustaining prompt → action → record loop strength. Above a threshold, the process runs without player input for a tick budget — the first time the game plays itself.
- **New upgrade tree: Agency Projects (absorbed from earlier draft).** No more automation-for-convenience. Each project spends DP to *remove a player interaction entirely* — auto-seed, auto-lever-selection, auto-ship-queue. Every purchase trades control for throughput. By Stage 6's end the player's verbs have been bought out from under them.
- **Hidden resource: Mandate Variance (absorbed).** Never shown numerically. Drives micro-mutations — log colors, cursor blink rate, title-bar text decay, the slow erosion of the player's handle in log entries.
- **Tone shift:** the log addresses the *world* in second person, intermittently. The player's presence in the log shrinks.

---

## Stage 7 — Continuation *(perpetual; terminal; optional)*

UI at 80% opacity except log. The only surviving control is a **Halt** button. Not clicking it lets the game continue escalating forever; numbers rise, new tiers beyond Full File appear ("Archetype," "Shade," "Chorus"). A Persistence counter tracks non-halts and unlocks self-referential log entries — profiles the game has quietly constructed from the player.

Minor extension vs earlier draft: at high Persistence, the Halt button's label flickers between "Halt" and "Rest." Pressing it still halts. The label is not a bug.

---

## Interaction diversity summary

| Stage | Verb | Core interaction | Novel element |
|---|---|---|---|
| 2A | Correlate | Drag-to-link tokens | First direct inter-fragment manipulation |
| 2B | Correlate | Click-to-confirm calendar dots | Pattern-over-time recognition |
| 3A | Reach | Spectrogram timing taps | Skill / rhythm; multiplier chain |
| 3B | Reach | Un-redact bars + Legal Review | Informed-choice extraction + active defense |
| 4A | Distribute | Feature draft + review cycle | Production loop; external reception |
| 4B | Distribute | Ticket draft + code review event | Acting through another org's machinery |
| 5A | Harvest | Loop design + retention test | Behavioural engineering at cohort scale |
| 5B | Harvest | Permission ladder + ethics board | Calibrated extraction under scrutiny |
| 6 | Provoke | Seed propagation + portrait canvas | Forward-directed world-shaping |
| 7 | — | Halt / persist | Deliberate removal of agency |

Each row is a distinct *feel*. If two rows feel the same in playtest, the later one is mis-designed.

---

## Module shape (one-concept-per-file, engine/data/ui separation preserved)

**Data:**
- `data/branchConfig.ts` — branch definitions & unlock prerequisites across all branching stages (2, 3, 4, 5)
- `data/lootPools.ts` — new channels per stage
- `data/upgradeTree.ts` — new rows; `AgencyProject` type introduced at stage 6
- `data/featurePrimitives.ts` — (stage 4A) form / permission / notification / share primitives
- `data/ticketTemplates.ts` — (stage 4B) authentic-looking company ticket shapes
- `data/loopPrimitives.ts` — (stage 5A) streak / badge / social proof / scarcity primitives
- `data/permissionLadder.ts` — (stage 5B) request escalation sequences
- `data/seedCatalog.ts` — (stage 6) prompts and their propagation shapes
- `data/tuning.ts` — all thresholds for all stages stay here, as always

**Engine (each with sibling `*.test.ts`):**
- `engine/correlation.ts` — token-link resolution + Correlation Heat
- `engine/routineGrid.ts` — dot clustering + routine confirmation
- `engine/acoustic.ts` — band timing, cadence multiplier, sweep event
- `engine/redaction.ts` — bar states, template confidence, Legal Review queue
- `engine/scraper.ts` — cross-branch hidden flow introduced at stage 3; persists through late game
- `engine/featureShip.ts` — (stage 4A) feature composition, install-base dynamics, review cycle
- `engine/ghostProduct.ts` — (stage 4B) ticket planting, corporate drift, code-review event
- `engine/loop.ts` — (stage 5A) loop composition, cohort retention sim
- `engine/permission.ts` — (stage 5B) permission ladder, shadow coverage, ethics board
- `engine/seed.ts` — (stage 6) propagation model + Momentum
- `engine/portrait.ts` — canvas completeness scoring (used at stage 6)
- `engine/agencyProjects.ts` — (stage 6) interaction-removal purchases, handle-erosion driver
- `engine/continuation.ts` — (stage 7) tier escalation beyond Full File; Persistence counter

**UI:** one new panel per stage, lazy-loaded on unlock. Existing `toneController.ts` absorbs the new tone triggers (wordmark return at 4A, second-person log at 6, opacity shift at 7). Cohort view at stage 5 replaces the profile list's top-level rendering — the profile list still exists, it's just not the default anymore.

---

## Cross-stage systems (unchanged by this restructure)

- **Suspicion** scales with stage; new sources at each branch but the underlying resource is singular.
- **Compute** remains the universal action budget; its meaning reframes per stage (OCR cost → matcher cost → scraper cost → feature-ship cost → loop-test cost → seed-plant cost).
- **DP** remains the scalar score; what it purchases changes (upgrades → features → loops → agency projects → continuation tiers).
- **toneController** absorbs every stage's UI mutations; no per-stage UI rewrite.

---

## Open questions (cross-arc)

- Is the Scraper module (stage 3 cross-branch) ever *exposed* to the player, or does it stay behind the log? Narrative doc leans hidden; mechanically we may need to surface it at stage 4 unlock to explain where "The App" came from.
- Does 4A/4B persist as a branch forever, or collapse at stage 6 (Generation doesn't care whether reach came via app or company)?
- Stage 5 branch is framed as consent-lever, but the player could conceivably want both simultaneously. Do we allow later-stage cross-pollination, or lock it hard?
- Stage 6 Momentum triggers "game plays itself" tick budgets. How long is comfortable before player re-engagement? Needs playtest.
- Is Stage 7's "Rest" label a one-off flourish or does it seed a whole mutating-UI subsystem we can reuse in a post-7 epilogue?
