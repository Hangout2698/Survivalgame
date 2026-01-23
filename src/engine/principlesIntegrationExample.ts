/**
 * Example Integration: Survival Principles in Decision Engine
 *
 * This file demonstrates how to integrate the survival principles service
 * with the game's decision engine to provide educational feedback.
 *
 * USAGE EXAMPLES:
 */

import {
  getPrinciplesByCategory,
  getRandomPrinciple,
  searchPrinciples,
  getPrinciplesForDecision,
  getEducationalFeedback,
  getEnvironmentTips,
  getMetadata
} from './survivalPrinciplesService';

/**
 * Example 1: Show a survival tip when the game starts
 */
export function showStartupTip(environment: string): string {
  const tips = getEnvironmentTips(environment);
  return tips[0] || "Remember: Stay calm and think before you act.";
}

/**
 * Example 2: Provide educational feedback after a decision
 */
export function enhanceDecisionFeedback(
  decisionId: string,
  quality: 'excellent' | 'good' | 'poor' | 'critical-error',
  existingFeedback: string
): string {
  const principle = getEducationalFeedback(decisionId, quality);

  if (principle) {
    return `${existingFeedback}\n\n💡 Survival Principle: ${principle}`;
  }

  return existingFeedback;
}

/**
 * Example 3: Display relevant principles in the UI
 */
export function getShelterBuildingTips(): string[] {
  return getPrinciplesByCategory('shelter').slice(0, 5);
}

/**
 * Example 4: Search for principles by keyword
 */
export function findRelevantAdvice(situation: string): string[] {
  const results = searchPrinciples(situation);
  return results.slice(0, 3).map(r => r.principle);
}

/**
 * Example 5: Get a random principle for a loading screen or tip
 */
export function getRandomSurvivalTip(): string {
  const categories = ['shelter', 'water', 'fire', 'food', 'priorities'] as const;
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  return getRandomPrinciple(randomCategory) || "Stay alert and aware of your surroundings.";
}

/**
 * Example 6: Show source attribution
 */
export function getPrincipleSource(): string {
  const metadata = getMetadata();
  return `Survival knowledge from: ${metadata.source} (${metadata.totalPrinciples} principles)`;
}

/**
 * Example 7: Provide contextual help during decision-making
 */
export function getDecisionHelp(decisionId: string): string | null {
  const principles = getPrinciplesForDecision(decisionId);

  if (principles.length === 0) return null;

  return `💡 Consider: ${principles[0]}`;
}

/**
 * INTEGRATION POINTS IN EXISTING CODE:
 *
 * 1. In decisionEngine.ts - evaluateDecisionQuality():
 *    Add educational feedback to decision outcomes
 *
 * 2. In Game.tsx - componentDidMount():
 *    Show environment-specific tips when game starts
 *
 * 3. In GameOutcome.tsx:
 *    Display relevant principles in the post-game analysis
 *
 * 4. In DecisionList.tsx:
 *    Show contextual hints when hovering over decisions
 *
 * 5. In MetricsDisplay.tsx:
 *    Add a "Survival Tips" section with rotating advice
 */

// Example of how to modify decisionEngine.ts evaluateDecisionQuality():
/*
export function evaluateDecisionQuality(
  decision: Decision,
  outcome: DecisionOutcome,
  state: GameState
): DecisionQuality {
  // ... existing evaluation logic ...

  const quality = determineQuality(...);

  // NEW: Add educational feedback from survival principles
  const educationalNote = getEducationalFeedback(decision.id, quality);
  if (educationalNote) {
    outcome.consequences.push({
      text: `📚 ${educationalNote}`,
      type: 'info'
    });
  }

  return quality;
}
*/

// Example of how to add tips to Game.tsx:
/*
useEffect(() => {
  if (gameState.turn === 0) {
    const tip = showStartupTip(gameState.scenario.environment);
    console.log('Survival Tip:', tip);
    // Or display in UI
  }
}, [gameState.turn]);
*/
