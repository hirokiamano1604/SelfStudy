# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GtoTrainer is a React Native / Expo app for practicing GTO (Game Theory Optimal) poker strategy. Users are shown a poker hand and must select the correct action (Fold / Open) for the selected table position.

## Commands

```bash
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run web          # Run in browser
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm run lint         # Run ESLint
npm run deploy       # Build web and deploy to GitHub Pages (gh-pages)
```

No test runner is configured. Only ESLint is available for code quality checks.

## Architecture

### File-based routing (Expo Router)

- `app/_layout.tsx` — Root layout; sets up theme provider and stack navigator
- `app/(tabs)/_layout.tsx` — Tab bar layout
- `app/(tabs)/index.tsx` — **Main trainer screen** (`GtoTrainerScreen`); contains the full game loop
- `app/modal.tsx` — Modal displaying the reference hand-range chart (`assets/images/table.jpg`)

### Game Logic

- `constants/pokerData.ts` — All 169 hands with rank tiers: `R_PURPLE > R_RED > R_YELLOW > R_GREEN > R_CYAN > R_WHITE > R_FOLD`
- `constants/rfiRanges.ts` — Maps each position (UTG, EP, LJ, HJ, CO, BTN) to the set of rank tiers that qualify as "Open"
- `utils/gameLogic.ts` — `evaluateAction(position, hand, userAction)` → validates user's answer against RFI ranges

### Current Game Loop (index.tsx)

1. User selects a position from the position selector
2. A random hand is drawn from `pokerData`
3. User taps Fold or Open
4. `evaluateAction` checks correctness; green/red feedback is shown
5. Correct answer auto-advances to next hand after 1 second; wrong answer shows "Next Hand" button

### Path Alias

`@/*` resolves to the project root (configured in `tsconfig.json`).

## Planned Feature: Adaptive Question Selection

`instruction.md` contains the full spec in Japanese. Summary:

- Track per `(position, hand)` correctness history in **AsyncStorage** (key: `gto_trainer_history`)
- A combination is "mastered" when answered correctly **N consecutive times** (default N=3, stored as a named constant)
- Exclude mastered combinations from the random hand pool for the currently selected position
- Fall back to full pool if all combinations in the current position are mastered
- Do **not** change the answer-evaluation logic in `rfiRanges.ts` / `gameLogic.ts`
- Optional extras: toggle to disable adaptive filtering; button to reset stored history

## Notes

- New Architecture and React Compiler are enabled (`app.json` → `experiments`)
- Web deployment targets GitHub Pages (`npm run deploy` uses `gh-pages`)
- Japanese is used in `instruction.md` and some comments
