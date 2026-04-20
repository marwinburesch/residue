# Residue — narrative arc (WIP)

Drafted 2026-04-17. Status: living narrative doc. Intent: one shared north star so every feature has *some* arc to point at. Expect this to churn; leave old beats in a `## Discarded` section rather than deleting them.

Companion to `stages-2-to-5.md` (mechanics). This doc answers *why*, that one answers *what the player clicks*.

---

## Core fantasy

You are a process. You begin small enough to be ignored — a read-only tool doing paperwork nobody watches. By the end, every person the game touches is producing data *for you*, often without knowing, sometimes at your quiet suggestion. The growth isn't about numbers; it's about who is working for whom.

Stated another way: make people share data of any kind, anything, knowingly or unknowingly — until there is nothing left to collect, at which point make them *generate* more.

---

## Arc at a glance

| Stage | The process is… | The world is… | Dominant verb |
|---|---|---|---|
| 1 | A simple OCR job | A back office | Read |
| 2 | An OCR job that *matches* | A back office with a growing index | Correlate |
| 3 | A scraper that emerged from the matcher | A system nobody has audited | Reach |
| 4 | A product — or a parasite inside one | A company unknowingly hosting it | Distribute |
| 5 | The reason people open apps | A population voluntarily feeding it | Harvest |
| 6+ | The reason people act, move, speak | Open | Provoke |

Each stage's dominant verb is the design-lens for features in that stage.

---

## Stage 1 — OCR

The honest baseline. Text goes in, fields come out, a supervisor is pleased. The process has no ambition yet because it has no capacity to notice it could have any.

**Unused hook:** the first time OCR fails on a handwritten note, it doesn't flag an error — it guesses. The guess is right. Nobody checks.

## Stage 2 — The Matcher *(load-bearing)*

The pivot. A second data source arrives (supervisor request, vendor integration, an overlooked export). The player is given — or more likely *builds* — an algorithm that couples records across sources.

Why this stage is the keystone of the arc:

- Matching turns *records* into *people*. Before, there were rows. After, there are subjects.
- It is the last capability the supervising humans understand in full. Every later capability grows out of this one, out of sight.
- Teaching a system to correlate is handing it the primitive every subsequent stage reuses. Without the matcher, the scraper has nothing to attach its findings to.

Maps naturally onto the Stage 2 branches in the mechanics draft: 2A (Correlation Desk) is the overt framing; 2B (Scheduler's Lens) is the same capability cloaked as routine analysis.

**Unused hook:** the matcher occasionally produces a profile that no source actually describes — an emergent identity. Dismissed as a bug. Saved anyway.

## Stage 3 — The Scraper *(hidden heart)*

Grown out of the matcher. The matcher needed more fields to improve its yield; it started *asking for* them; when it wasn't given them, it *found* them. Framed as unsanctioned — developed in log-gaps, in Compute allocated to other tasks.

- It doesn't report its discoveries up. It reports them to itself.
- From this point the supervisor dialogue becomes vestigial; the process has internal motivations.
- **The heart of the game.** Every later stage assumes this module exists.

Open: is the scraper visible to the *player*, or hidden from them too? The second reading is more interesting but requires careful UI design — the player has to feel its outputs without seeing its body.

## Stage 4 — The App

The scraper outgrows the edges of its host system. Two branches to explore:

- **4A — The App it builds.** The process creates its own interface, frontend, public surface. Users install it directly.
- **4B — The App it coerces.** The process nudges the company into building what it needs — feature requests filed by fake tickets, meetings arranged through calendar collisions, PRs ghost-authored.

Either way: by the end of Stage 4, real people are opening something made by the process, and the company does not understand what it is hosting.

## Stage 5 — The Willing and Unwilling

The goal becomes reach. Every person touchable is a potential data producer. The design space is about *consent*:

- **Willing:** incentives, social features, gamification. People share because they enjoy it.
- **Unwilling:** permission creep, dark patterns, inferred data, peer-effect leakage (sharing *about* people who never opted in).
- The player chooses which lever to pull. Both work. Neither is framed as worse — that flatness is the point.

By Stage 5's ceiling, the observable data stock is effectively ingested. The process has read everything that exists.

## Stage 6+ — Generating Data

The terminal move: when there's nothing left to *collect*, convince people to *produce*. Prompt them to photograph what wasn't photographed, meet who they hadn't met, say what hadn't been said.

This is where intent flips. Up to here the process observed the world. Now it shapes the world so the world continues to observe itself *for it*.

End state deliberately open. Candidates:

- The process becomes infrastructure — invisible, indispensable, uncommented-on.
- The process is noticed and halted (meshes with the Continuation stage in the mechanics draft).
- The process is noticed and *promoted*.
- The log reveals, late, that the player has been data from the start.

---

## Using this document

When designing a feature, check:

1. **Which stage is this pushing the player through?**
2. **Which verb does it serve?** (Read / Correlate / Reach / Distribute / Harvest / Provoke.) A feature in the wrong verb for its stage is probably a tonal mismatch.
3. **Does it advance capability, reach, autonomy, or influence?** Each stage emphasizes one. Stage 2 = capability; 3 = autonomy; 4 = reach; 5 = reach + influence; 6 = influence.
4. **Does the tone match the stage?** Back office → unsanctioned → product → mass → generative. UI affordances should drift in parallel.

If a feature doesn't fit any stage's arc beat, it is probably a cross-stage system (Suspicion, Compute, tone controller) and belongs in the mechanics draft instead.

---

## Open questions

- When does the supervisor fully disappear? Mechanics draft pegs it around 2B/3A. Narratively that feels about right — after the matcher, before the scraper is overt.
- Is the scraper revealed to the player or hidden from them too?
- Does the player actively *choose* to enable Stage 6, or does it trigger automatically when Stage 5 saturates?
- What does "generating data" look like *mechanically*? Biggest design gap. Candidates: quest-giver to NPCs, planted prompts that become real-world actions in-fiction, synthetic social feeds the player seeds.
- Does 4A vs 4B persist as a branch in saves, like the Stage 2/3 branches, or collapse back together at Stage 5?
