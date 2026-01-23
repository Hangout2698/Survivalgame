/**
 * Survival Principles Service
 *
 * This service provides access to survival principles extracted from the SAS Survival Handbook.
 * It can be used to enhance decision evaluation, provide contextual feedback, and generate
 * educational content based on real survival knowledge.
 */

import survivalPrinciplesData from '../data/survivalPrinciples.json';

export interface SurvivalPrinciplesData {
  metadata: {
    source: string;
    extractedAt: string;
    totalCategories: number;
    totalPrinciples: number;
  };
  principles: {
    shelter: string[];
    water: string[];
    fire: string[];
    food: string[];
    navigation: string[];
    signaling: string[];
    firstAid: string[];
    priorities: string[];
    psychology: string[];
    weather: string[];
  };
}

export type PrincipleCategory = keyof SurvivalPrinciplesData['principles'];

/**
 * Get all survival principles
 */
export function getAllPrinciples(): SurvivalPrinciplesData {
  return survivalPrinciplesData as SurvivalPrinciplesData;
}

/**
 * Get principles for a specific category
 */
export function getPrinciplesByCategory(category: PrincipleCategory): string[] {
  const data = survivalPrinciplesData as SurvivalPrinciplesData;
  return data.principles[category] || [];
}

/**
 * Get a random principle from a specific category
 */
export function getRandomPrinciple(category: PrincipleCategory): string | null {
  const principles = getPrinciplesByCategory(category);
  if (principles.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * principles.length);
  return principles[randomIndex];
}

/**
 * Get relevant principles based on a keyword or context
 */
export function searchPrinciples(query: string): Array<{ category: PrincipleCategory; principle: string }> {
  const data = survivalPrinciplesData as SurvivalPrinciplesData;
  const results: Array<{ category: PrincipleCategory; principle: string }> = [];
  const queryLower = query.toLowerCase();

  for (const [category, principles] of Object.entries(data.principles)) {
    for (const principle of principles) {
      if (principle.toLowerCase().includes(queryLower)) {
        results.push({
          category: category as PrincipleCategory,
          principle
        });
      }
    }
  }

  return results;
}

/**
 * Get principles relevant to a decision type
 * Maps decision actions to relevant principle categories
 */
export function getPrinciplesForDecision(decisionId: string): string[] {
  const categoryMap: Record<string, PrincipleCategory[]> = {
    'build-shelter': ['shelter', 'priorities'],
    'improve-shelter': ['shelter'],
    'start-fire': ['fire', 'priorities'],
    'maintain-fire': ['fire'],
    'find-water': ['water', 'priorities'],
    'purify-water': ['water'],
    'forage': ['food'],
    'hunt': ['food'],
    'fish': ['food'],
    'navigate': ['navigation', 'priorities'],
    'signal': ['signaling', 'priorities'],
    'treat-injury': ['firstAid'],
    'rest': ['psychology', 'priorities'],
    'stay-put': ['priorities', 'psychology'],
    'panic-move': ['psychology', 'priorities'],
    'assess-weather': ['weather'],
  };

  const categories = categoryMap[decisionId] || [];
  const allPrinciples: string[] = [];

  for (const category of categories) {
    allPrinciples.push(...getPrinciplesByCategory(category).slice(0, 3));
  }

  return allPrinciples;
}

/**
 * Get educational feedback based on decision quality
 * Returns a relevant principle that explains why a decision was good or bad
 */
export function getEducationalFeedback(
  decisionId: string,
  quality: 'excellent' | 'good' | 'poor' | 'critical-error'
): string | null {
  const principles = getPrinciplesForDecision(decisionId);

  if (principles.length === 0) {
    // Fallback to general survival principles
    const generalPrinciples = getPrinciplesByCategory('priorities');
    if (generalPrinciples.length > 0) {
      return generalPrinciples[0];
    }
    return null;
  }

  // For good decisions, return a supportive principle
  // For poor decisions, return a cautionary principle
  const index = quality === 'poor' || quality === 'critical-error' ? 0 : Math.floor(Math.random() * Math.min(3, principles.length));
  return principles[index] || null;
}

/**
 * Get survival tips for the current environment
 */
export function getEnvironmentTips(environment: string): string[] {
  const tips: string[] = [];

  // Add general priorities
  tips.push(...getPrinciplesByCategory('priorities').slice(0, 2));

  // Add environment-specific tips
  switch (environment.toLowerCase()) {
    case 'forest':
    case 'jungle':
      tips.push(...getPrinciplesByCategory('shelter').slice(0, 2));
      tips.push(...getPrinciplesByCategory('water').slice(0, 1));
      break;
    case 'desert':
      tips.push(...getPrinciplesByCategory('water').slice(0, 2));
      tips.push(...getPrinciplesByCategory('shelter').slice(0, 1));
      break;
    case 'arctic':
    case 'tundra':
      tips.push(...getPrinciplesByCategory('shelter').slice(0, 2));
      tips.push(...getPrinciplesByCategory('fire').slice(0, 1));
      break;
    case 'mountain':
      tips.push(...getPrinciplesByCategory('navigation').slice(0, 1));
      tips.push(...getPrinciplesByCategory('shelter').slice(0, 1));
      tips.push(...getPrinciplesByCategory('weather').slice(0, 1));
      break;
    default:
      tips.push(...getPrinciplesByCategory('shelter').slice(0, 1));
      tips.push(...getPrinciplesByCategory('water').slice(0, 1));
  }

  return tips;
}

/**
 * Get all available categories
 */
export function getCategories(): PrincipleCategory[] {
  return Object.keys(getAllPrinciples().principles) as PrincipleCategory[];
}

/**
 * Get metadata about the principles source
 */
export function getMetadata() {
  return getAllPrinciples().metadata;
}
