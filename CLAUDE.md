# CLAUDE.md

Residue — browser-based incremental game. See `residue-game-design.md` for full design.

## Tech stack

- **Bun** for package management, dev server (`bun --hot`), bundling (`bun build`), tests (`bun test`). No Node.
- **Vanilla TypeScript**, no frameworks.
- **DOM + CSS** for UI, **Web Audio API** for sound, **localStorage** for persistence.

## Architecture

Strict one-way dependency: `data → engine → ui`.

- `src/data/` — pure content (loot pools, upgrades, tuning). No imports from engine/ui.
- `src/engine/` — pure logic. No DOM, no `window`, no `document`. Must run under `bun test`.
- `src/ui/` — only layer that touches DOM and browser APIs.
- UI ↔ engine communicate via a typed event bus, never direct sibling imports.

## Code quality rules

- **One concept per file.** Split when a file owns more than one system, or passes ~200 lines of logic / 3+ unrelated exports.
- **Don't split by layer alone.** No per-feature `types.ts`/`utils.ts`/`constants.ts` trios. Colocate small helpers; promote to shared only on the second real reuse.
- **Pure functions over classes** in the engine. State lives in a single `GameState` passed explicitly.
- **Side effects (save, audio, DOM) only in UI or the tick scheduler** — never mid-reducer.
- **Magic numbers live in `data/tuning.ts`.** Balance changes touch one file.
- **No premature abstraction.** Third instance, not the first.
- **Max two folder levels under `src/`.**
- **No `helpers.ts` / `misc.ts`.** Name files for what they do.
- **Default to no comments.** Only when the *why* is non-obvious.

## Testing

- Every engine module has a sibling `*.test.ts`. Run with `bun test`.
- Test rules, not implementation.
- UI is exercised manually; keep UI logic thin enough that this is fine.

## Adding a feature

1. Extend `data/`.
2. Extend `engine/` + test.
3. Wire `ui/` last.

If only `data/` changed, that's the success case.

## Naming

- Filenames lowercase camelCase, matching primary export (`profileMatcher.ts`).
- Save key: `residue:save`.
