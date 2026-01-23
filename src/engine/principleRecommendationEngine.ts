import { PrincipleCategory, getPrinciplesByCategory } from './survivalPrinciplesService';
import { GameState } from '../types/game';

export interface MistakePattern {
  category: PrincipleCategory;
  principle: string;
  occurrences: number;
  severity: 'minor' | 'moderate' | 'critical';
}

function identifyCategoryFromPrinciple(principleText: string): PrincipleCategory | null {
  const text = principleText.toLowerCase();

  if (text.includes('shelter') || text.includes('protection')) return 'shelter';
  if (text.includes('water') || text.includes('hydration')) return 'water';
  if (text.includes('fire') || text.includes('warmth')) return 'fire';
  if (text.includes('food') || text.includes('energy')) return 'food';
  if (text.includes('navigation') || text.includes('direction')) return 'navigation';
  if (text.includes('signal')) return 'signaling';
  if (text.includes('injury') || text.includes('medical') || text.includes('bleeding')) return 'firstAid';
  if (text.includes('priority') || text.includes('survival needs')) return 'priorities';
  if (text.includes('morale') || text.includes('panic')) return 'psychology';
  if (text.includes('weather') || text.includes('temperature') || text.includes('hypothermia')) return 'weather';

  return null;
}

export function analyzeMistakes(state: GameState): MistakePattern[] {
  const poorDecisions = state.history.filter(h =>
    h.decisionQuality === 'poor' || h.decisionQuality === 'critical-error'
  );

  // Group by principle category
  const categoryMap: Record<string, number> = {};

  poorDecisions.forEach(decision => {
    // Extract category from principle text
    const principle = decision.survivalPrincipleAlignment || '';
    const category = identifyCategoryFromPrinciple(principle);

    if (category) {
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    }
  });

  // Convert to patterns
  const patterns: MistakePattern[] = [];

  Object.entries(categoryMap).forEach(([category, count]) => {
    const principles = getPrinciplesByCategory(category as PrincipleCategory);

    if (principles.length > 0) {
      patterns.push({
        category: category as PrincipleCategory,
        principle: principles[0],
        occurrences: count,
        severity: count >= 3 ? 'critical' : count >= 2 ? 'moderate' : 'minor'
      });
    }
  });

  return patterns.sort((a, b) => b.occurrences - a.occurrences);
}

export function getPersonalizedTip(state: GameState): string | null {
  const mistakes = analyzeMistakes(state);

  if (mistakes.length === 0) {
    return null; // No mistakes, no tip needed
  }

  const topMistake = mistakes[0];

  if (topMistake.severity === 'critical') {
    return `⚠️ You've struggled with ${topMistake.category}. Remember: ${topMistake.principle}`;
  } else if (topMistake.severity === 'moderate') {
    return `💡 Consider focusing on ${topMistake.category}: ${topMistake.principle}`;
  }

  return null;
}
