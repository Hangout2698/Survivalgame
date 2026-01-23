# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **turn-based survival decision game** built with React/TypeScript that simulates realistic wilderness survival scenarios. Players make decisions that affect their survival metrics, with outcomes based on actual survival principles. The game evaluates decisions using probabilistic outcomes and tracks player performance.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking (no emit)
```

### Security: Update Vulnerable Dependencies

Your goal is to update any vulnerable dependencies.

Do the following:

1. Run `npm audit` to find vulnerable installed packages in this project
2. Run `npm audit fix` to apply updates
3. Run tests and verify the updates didn't break anything

## Architecture

### Three-Layer System

The codebase follows a clear separation of concerns:

**1. Engine Layer** (`src/engine/`)
- Pure game logic with no UI dependencies
- All files export functions that operate on game state
- Stateless calculations and deterministic outcomes (except for RNG)

**2. Type Layer** (`src/types/game.ts`)
- Single source of truth for all game types
- All engine and component files import from here
- No circular dependencies

**3. Component Layer** (`src/components/`)
- React components that consume engine functions
- Responsible for state management and UI rendering
- Uses Tailwind CSS for styling

### Core Game Loop

```
User Action → makeDecision() → applyDecision() → updateMetrics() → checkEndConditions()
     ↓              ↓                  ↓                 ↓                  ↓
  Decision     GameState         DecisionOutcome   PlayerMetrics      GameStatus
```

**Key Flow:**
1. `Game.tsx` calls `getAvailableDecisions(state)` to generate contextual decisions
2. User selects decision → `makeDecision(state, decision)` is called
3. `applyDecision()` generates outcome with probabilistic results (using `Math.random()`)
4. Outcome includes `metricsChange` which is applied via `updateMetrics()`
5. Environmental effects are calculated and merged with decision effects
6. **Delayed effects** are checked and applied if their turn has arrived
7. `checkEndConditions()` determines if game should end

### Critical Implementation Details

#### Delayed Effects System
**Location:** `src/engine/gameController.ts:114-143`

The game supports delayed effects that trigger on future turns:
- Created in `applyDecision()` for decisions like `panic-move` and `descend`
- Stored in `DecisionOutcome.delayedEffects[]` with `turn` and `metricsChange`
- Applied in `makeDecision()` by checking `state.history` for effects matching current turn
- Effects are merged into metrics changes before `updateMetrics()` is called

**Example:** A fall during panic-move causes immediate injury + delayed worsening injury 1-2 turns later.

#### Metrics System
**Location:** `src/engine/metricsSystem.ts`

Nine interconnected metrics tracked (0-100 scale, except body temperature):
- `energy`, `hydration`, `morale`, `shelter`, `injurySeverity`
- `bodyTemperature` (32-42°C, normal: 37°C)
- `signalEffectiveness` (calculated based on conditions)
- `cumulativeRisk` (accumulates throughout game)
- `survivalProbability` (calculated formula considering all metrics)

**Key Insight:** `applyEnvironmentalEffects()` returns passive degradation that's **added** to decision effects in `applyDecision()` before metrics update. This ensures both active decisions and passive time effects are combined.

#### Decision Generation
**Location:** `src/engine/decisionEngine.ts`

Decisions are dynamically generated based on:
1. **Environment** - Each of 6 environments has unique navigation/survival decisions
2. **Equipment** - Available items unlock specific actions (whistle → signaling, knife → shelter improvements)
3. **Metrics** - Low energy prevents high-cost actions; injuries unlock treatment options
4. **Context** - Time of day, weather, and turn number affect available choices

**Returns:** Maximum 6 decisions per turn (see `decisions.slice(0, 6)` at line 574)

#### Decision Quality Evaluation
**Location:** `src/engine/decisionEngine.ts:27-129`

Every decision is evaluated post-execution:
- Quality levels: `excellent`, `good`, `poor`, `critical-error`
- Tracks alignment with survival principles (e.g., "SHELTER PRIORITY", "STAY PUT")
- Stored in outcome and displayed in post-game analysis
- Powers the good/poor decisions tracking in `GameState`

### Scenario Generation
**Location:** `src/engine/scenarioGenerator.ts`

Procedurally generates survival scenarios with:
- 6 environments × 4 weather types × 6 times of day
- Random equipment selection (2-4 items from pool of 12)
- Temperature/wind calculations based on environment + weather + time
- Initial injury/condition selection

**Backstories:** `src/engine/briefingGenerator.ts` contains detailed backstories for each environment that are filtered for consistency (e.g., frostbite only appears in cold conditions).

### Supabase Integration
**Location:** `src/engine/survivalGuideService.ts`

Optional feature that loads survival guides from Supabase:
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
- Survival guides are used to generate contextual feedback in `generateGuidanceBasedFeedback()`
- Game works without Supabase (returns null, handled gracefully)

### Survival Principles Integration
**Location:** `src/engine/survivalPrinciplesService.ts`

The game now includes 200+ survival principles extracted from the SAS Survival Handbook:
- Principles organized into 10 categories: shelter, water, fire, food, navigation, signaling, firstAid, priorities, psychology, weather
- Extracted from PDF references stored in `survival-reference/` folder
- Principles available in `src/data/survivalPrinciples.json`
- Service provides functions to:
  - Get principles by category
  - Search principles by keyword
  - Get contextual principles for specific decisions
  - Generate educational feedback based on decision quality
  - Provide environment-specific survival tips

**To extract updated principles:**
```bash
npm run extract-principles
```

**Integration examples:** See `src/engine/principlesIntegrationExample.ts` for usage patterns

## Critical Bugs Fixed (January 2025)

If you encounter issues, these bugs were recently fixed:

1. **shelter vs shelterQuality:** PlayerMetrics uses `shelter`, not `shelterQuality` or `fireQuality`
2. **Delayed effects:** Now properly applied in `makeDecision()` by checking turn numbers
3. **Environmental effects:** All metrics (including `injurySeverity` and `shelter`) now include environmental degradation

## Game Balance Notes

### Win Conditions
1. Successfully navigate to safety (probability-based on navigation actions)
2. Signal rescue: 3+ successful signals with 60+ effectiveness after turn 8
3. Endure: Survive 15+ turns with 55+ survival probability

### Lose Conditions
- Body temperature ≤ 31.5°C or ≥ 41.5°C
- Energy ≤ 3 or Hydration ≤ 5
- Injury Severity ≥ 90
- Survival Probability < 5 after turn 5

### Energy Scaling
**Location:** `src/engine/decisionEngine.ts:5-25`

Energy costs are dynamically scaled based on player condition:
- Well-rested (70+ energy, 60+ hydration, <20 injury) = 40% discount on low-risk actions
- Exhausted (<30 energy) or dehydrated (<30 hydration) = 40% penalty on all actions

This creates a compounding difficulty curve.

## Code Patterns

### Adding New Decisions

1. Add decision ID case to `applyDecision()` switch statement
2. Define `metricsChange`, `immediateEffect`, and `consequences[]`
3. Optionally add to `evaluateDecisionQuality()` for principle tracking
4. For equipment-based decisions, add to `getEquipmentBasedDecisions()`
5. For environment-specific, add to `getEnvironmentSpecificDecisions()`

### Adding New Metrics

1. Add to `PlayerMetrics` interface in `src/types/game.ts`
2. Initialize in `initializeMetrics()` in `metricsSystem.ts`
3. Add update logic in `updateMetrics()` with `clamp()` for bounds
4. Add to `applyEnvironmentalEffects()` if it degrades passively
5. Update UI in `MetricsDisplay.tsx`
6. Consider adding to `calculateSurvivalProbability()` formula

### Probability-Based Outcomes

Most decision outcomes use `Math.random()` for variability:
```typescript
const roll = Math.random();
if (roll > 0.7) {
  // 30% chance - good outcome
} else if (roll > 0.4) {
  // 30% chance - neutral outcome
} else {
  // 40% chance - bad outcome
}
```

Higher thresholds (0.8, 0.9) are used for exceptional outcomes.

## File Reference

**Core Engine:**
- `gameController.ts` - Main game loop, decision processing, delayed effects
- `metricsSystem.ts` - Metric calculations, environmental effects, end conditions
- `decisionEngine.ts` - Decision generation (1460+ lines), outcome application
- `scenarioGenerator.ts` - Procedural scenario creation
- `survivalRules.ts` - Post-game performance analysis

**Supporting Engine:**
- `briefingGenerator.ts` - Narrative text generation for scenarios
- `windSystem.ts` - Wind chill calculations
- `survivalGuideService.ts` - Optional Supabase integration
- `survivalPrinciplesService.ts` - Survival principles from SAS Handbook
- `principlesIntegrationExample.ts` - Integration examples and patterns

**Key Components:**
- `Game.tsx` - Main game component, state management
- `GameOutcome.tsx` - End-game results screen with decision analysis
- `MetricsDisplay.tsx` - Real-time player condition display
- `DecisionList.tsx` - Interactive decision selection UI

## Environment Variables

Required for Supabase features (optional):
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Game works without these variables; survival guide features simply disabled.
