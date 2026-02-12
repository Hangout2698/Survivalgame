/**
 * Principle Progress Service
 *
 * Tracks principle discovery progress and recommends next principles to discover
 * based on player's weak categories and decision patterns.
 */

import type { GameState } from '../types/game';
import { getAllPrinciples, type PrincipleCategory } from './survivalPrinciplesService';

export interface NextPrinciple {
  category: PrincipleCategory;
  principle: string;
  progress: number; // 0-100, how close player is to discovering this
  hint: string; // What actions might unlock it
}

/**
 * Analyze category mastery from game history
 */
function getCategoryMastery(state: GameState): Record<PrincipleCategory, number> {
  const categories: PrincipleCategory[] = [
    'shelter', 'water', 'fire', 'food', 'navigation',
    'signaling', 'firstAid', 'priorities', 'psychology', 'weather'
  ];

  const mastery: Record<string, number> = {};
  categories.forEach(cat => mastery[cat] = 0);

  // Count decisions by category
  const decisionCategoryMap: Record<string, PrincipleCategory[]> = {
    'shelter': ['shelter', 'priorities'],
    'improve-shelter': ['shelter'],
    'start-fire': ['fire', 'priorities'],
    'maintain-fire': ['fire'],
    'gather-wood': ['fire'],
    'find-water': ['water', 'priorities'],
    'purify-water': ['water'],
    'use-whistle': ['signaling', 'priorities'],
    'use-mirror': ['signaling'],
    'signal-fire': ['signaling', 'fire'],
    'treat-injury': ['firstAid'],
    'rest': ['psychology', 'priorities'],
    'navigate': ['navigation', 'priorities'],
    'scout': ['navigation'],
  };

  state.history.forEach(outcome => {
    const decisionId = outcome.decision.id;
    const relevantCategories = decisionCategoryMap[decisionId] || [];

    relevantCategories.forEach(cat => {
      // Good decisions increase mastery more
      if (outcome.decisionQuality === 'excellent') {
        mastery[cat] = (mastery[cat] || 0) + 3;
      } else if (outcome.decisionQuality === 'good') {
        mastery[cat] = (mastery[cat] || 0) + 2;
      } else {
        mastery[cat] = (mastery[cat] || 0) + 1;
      }
    });
  });

  // Normalize to 0-100
  const maxValue = Math.max(...Object.values(mastery), 1);
  categories.forEach(cat => {
    mastery[cat] = Math.round((mastery[cat] / maxValue) * 100);
  });

  return mastery as Record<PrincipleCategory, number>;
}

/**
 * Get 2-3 next principles the player is close to discovering
 */
export function getNextPrinciples(state: GameState, count: number = 3): NextPrinciple[] {
  const allPrinciples = getAllPrinciples();
  const discovered = state.discoveredPrinciples || new Set<string>();
  const mastery = getCategoryMastery(state);

  const candidates: NextPrinciple[] = [];

  // Find undiscovered principles from categories with some activity but not mastered
  const categories = Object.entries(mastery)
    .filter(([, score]) => score > 10 && score < 80) // Active but not mastered
    .sort((a, b) => b[1] - a[1]) // Highest mastery first
    .slice(0, 5); // Top 5 categories

  categories.forEach(([category, score]) => {
    const categoryPrinciples = allPrinciples.principles[category as PrincipleCategory];

    categoryPrinciples.forEach((principle: string) => {
      if (!discovered.has(principle)) {
        candidates.push({
          category: category as PrincipleCategory,
          principle,
          progress: score,
          hint: getHintForCategory(category as PrincipleCategory)
        });
      }
    });
  });

  // Also add some from weakest categories to encourage exploration
  const weakCategories = Object.entries(mastery)
    .filter(([, score]) => score < 30)
    .sort((a, b) => a[1] - b[1]) // Lowest first
    .slice(0, 2);

  weakCategories.forEach(([category, score]) => {
    const categoryPrinciples = allPrinciples.principles[category as PrincipleCategory];
    const undiscovered = categoryPrinciples.filter((p: string) => !discovered.has(p));

    if (undiscovered.length > 0) {
      const randomPrinciple = undiscovered[Math.floor(Math.random() * undiscovered.length)];
      candidates.push({
        category: category as PrincipleCategory,
        principle: randomPrinciple,
        progress: score,
        hint: getHintForCategory(category as PrincipleCategory)
      });
    }
  });

  // Sort by progress and return top N
  return candidates
    .sort((a, b) => b.progress - a.progress)
    .slice(0, count);
}

/**
 * Get hint text for how to unlock principles in a category
 */
function getHintForCategory(category: PrincipleCategory): string {
  const hints: Record<PrincipleCategory, string> = {
    shelter: 'Build or improve shelter',
    water: 'Find and purify water sources',
    fire: 'Start and maintain fires',
    food: 'Forage or hunt for food',
    navigation: 'Scout terrain and navigate',
    signaling: 'Attempt rescue signals',
    firstAid: 'Treat injuries and rest',
    priorities: 'Make strategic decisions',
    psychology: 'Manage morale and rest',
    weather: 'Adapt to weather conditions'
  };

  return hints[category] || 'Make relevant decisions';
}

/**
 * Check if a principle should unlock advanced decisions
 */
export function getUnlockedDecisionTypes(state: GameState): Set<string> {
  const alignment = state.principleAlignmentScore || 0;
  const unlocked = new Set<string>();

  if (alignment >= 80) {
    unlocked.add('expert-shelter'); // Expert shelter construction
    unlocked.add('strategic-signal'); // Strategic signaling
    unlocked.add('efficient-navigate'); // Efficient navigation
  }

  if (alignment >= 70) {
    unlocked.add('advanced-fire'); // Advanced fire techniques
    unlocked.add('optimized-rest'); // Optimized rest strategy
  }

  if (alignment >= 60) {
    unlocked.add('improved-scout'); // Improved scouting
    unlocked.add('better-forage'); // Better foraging
  }

  return unlocked;
}

/**
 * Get category icon/emoji for visual display
 */
export function getCategoryIcon(category: PrincipleCategory): string {
  const icons: Record<PrincipleCategory, string> = {
    shelter: '🏠',
    water: '💧',
    fire: '🔥',
    food: '🍖',
    navigation: '🧭',
    signaling: '📡',
    firstAid: '⚕️',
    priorities: '⭐',
    psychology: '🧠',
    weather: '🌦️'
  };

  return icons[category] || '📚';
}
