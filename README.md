# Tic-Tac-Toe

## What this is

A single-player tic-tac-toe game against the computer, built with React, TypeScript, and Vite. Three difficulty levels: easy (mostly random), medium (mix of optimal and random), and hard (unbeatable minimax). Neon noir arcade visual style. Game state persists across page reloads via localStorage. No backend, no database, no UI framework, no state management library.

## Setup

```
npm install
npm run dev
```

## How to play

Pick a difficulty on the menu screen to start. You play as X, the computer plays as O. Click an empty cell to place your mark. The computer responds after a short delay. Scores persist across rounds and across page reloads. After a game ends, choose to play again at the same difficulty or return to the menu.

Close the tab and come back later — your game and scores will be right where you left them. In-progress games resume exactly where they stopped, including mid-turn state: if you reload while the computer is thinking, it will re-evaluate and play its move after the normal delay. The saved state is versioned, so future updates can safely invalidate old saves without breaking the app.

## Validation

```
npm run test
npm run build
npm run lint
```

70 tests cover the pure game engine and persistence layer: all 8 winning lines, draw detection, invalid move handling, easy-mode suboptimality under controlled randomness, an exhaustive proof that hard mode never loses from any reachable game state, localStorage hydration validation for both valid and corrupt saved states, and schema version mismatch rejection.

## AI usage

This project was built entirely through iterative prompting with Claude. Each prompt below includes the judgment call that shaped it.

1. **"Create a React + TypeScript project using Vite for a single-player tic-tac-toe game"** — Started with a working vertical slice rather than an empty scaffold, so every later refactor had running code to validate against.

2. **"Propose a file structure with clean separation of concerns"** — Asked for the architecture plan before writing feature code, so the component boundaries were deliberate rather than emergent.

3. **"Keep the pure game engine in a single file"** — Overrode the initial three-file split (types/logic/ai) because the domain is small enough that splitting creates import ceremony without readability gain.

4. **"Implement only the pure game engine and its tests"** — Built and validated the engine layer in isolation before touching React, so the hook and UI could trust the engine contract.

5. **"Create a custom hook in src/hooks/useGame.ts and refactor App to use it"** — Pulled state orchestration into the hook as a standalone step, keeping the diff reviewable and the UI temporarily minimal.

6. **"Do the component pass"** — Created all presentational components in one focused step after the hook was stable, rather than interleaving structural and visual changes.

7. **"Do a polish pass"** — Saved all visual design, microinteractions, accessibility tightening, and the README for a single final pass, so the architecture was locked before aesthetics entered the picture.

8. **"Add localStorage persistence and a small visual polish pass"** — Combined persistence with targeted visual improvements (CPU thinking state, mark animations, menu presence) because both are experience-level concerns that don't change the architecture.
