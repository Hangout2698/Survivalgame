/**
 * Decision Calculator
 *
 * Calculates accurate resource costs, success probabilities, and post-decision state
 * for each decision based on current game state, environmental conditions, and player condition.
 */

import type { Decision, GameState, PlayerMetrics } from '../types/game';

export interface DecisionCalculation {
  // Resource costs
  energyCost: number;
  hydrationCost: number;
  temperatureChange: number;
  moraleChange: number;
  shelterChange: number;
  riskChange: number;

  // Cost breakdown
  costBreakdown: {
    baseCost: number;
    environmentalMultiplier: number;
    conditionMultiplier: number;
    finalCost: number;
  };

  // Success probability
  successProbability: number;
  successFactors: {
    baseRate: number;
    environmentalModifier: number;
    playerStateModifier: number;
  };

  // Post-decision state
  postDecisionState: {
    energy: number;
    hydration: number;
    bodyTemperature: number;
    morale: number;
    shelter: number;
  };

  // Risk assessment
  riskLevel: 'safe' | 'manageable' | 'risky' | 'dangerous' | 'critical';
  warnings: string[];
  criticalThresholds: string[];
}

// Calculate environmental multiplier for energy cost
function calculateEnvironmentalMultiplier(state: GameState): number {
  let multiplier = 1.0;
  const { scenario, currentTimeOfDay } = state;

  // Weather impact
  if (scenario.weather === 'storm' || scenario.weather === 'snow') {
    multiplier += 0.4; // Whiteout conditions
  } else if (scenario.weather === 'rain') {
    multiplier += 0.2;
  } else if (scenario.weather === 'wind') {
    multiplier += 0.15;
  }

  // Temperature impact
  if (scenario.temperature < 0) {
    multiplier += 0.3;
  } else if (scenario.temperature < 10) {
    multiplier += 0.2;
  } else if (scenario.temperature > 35) {
    multiplier += 0.25;
  }

  // Wind impact
  if (scenario.windSpeed > 30) {
    multiplier += 0.2;
  } else if (scenario.windSpeed > 15) {
    multiplier += 0.1;
  }

  // Time of day impact
  if (currentTimeOfDay === 'night' || currentTimeOfDay === 'dusk') {
    multiplier += 0.15;
  }

  return multiplier;
}

// Calculate player condition multiplier for energy cost
function calculateConditionMultiplier(metrics: PlayerMetrics): number {
  let multiplier = 1.0;
  const { energy, hydration, injurySeverity } = metrics;

  // Energy deficiency penalty
  if (energy < 30) {
    multiplier += 0.4;
  } else if (energy < 50) {
    multiplier += 0.2;
  } else if (energy >= 70 && hydration >= 60 && injurySeverity < 20) {
    // Well-rested bonus
    multiplier -= 0.4;
  }

  // Hydration deficiency penalty
  if (hydration < 30) {
    multiplier += 0.4;
  } else if (hydration < 50) {
    multiplier += 0.2;
  }

  // Injury penalty
  if (injurySeverity > 50) {
    multiplier += 0.3;
  } else if (injurySeverity > 30) {
    multiplier += 0.15;
  }

  return Math.max(0.6, multiplier); // Minimum 0.6x multiplier
}

// Calculate base success rate for different action types
function getBaseSuccessRate(decisionId: string): number {
  // Rest and basic actions - always succeed
  if (decisionId.includes('rest') || decisionId.includes('wait')) return 1.0;
  if (decisionId === 'shelter') return 0.95;
  if (decisionId.includes('create-windbreak')) return 0.95;

  // Equipment usage - high success with proper equipment
  if (decisionId.includes('use-knife') || decisionId.includes('use-blanket')) return 0.90;
  if (decisionId.includes('use-whistle') || decisionId.includes('use-mirror')) return 0.90;

  // Improvisation - moderate success
  if (decisionId.includes('improvise')) return 0.80;
  if (decisionId === 'signal' || decisionId.includes('signal-')) return 0.75;

  // Scouting and searching - variable
  if (decisionId.includes('scout') || decisionId.includes('search')) return 0.70;
  if (decisionId.includes('find-landmark')) return 0.65;

  // Navigation - highly variable, weather-dependent
  if (decisionId.includes('retrace') || decisionId.includes('backtrack')) return 0.70;
  if (decisionId.includes('navigate') || decisionId.includes('travel')) return 0.60;
  if (decisionId.includes('descend') || decisionId.includes('climb')) return 0.65;

  // Default moderate success
  return 0.70;
}

// Calculate environmental modifier for success probability
function calculateSuccessEnvironmentalModifier(state: GameState, decisionId: string): number {
  let modifier = 0;
  const { scenario, currentTimeOfDay } = state;

  // Navigation/travel actions are heavily affected by weather
  const isNavigation = decisionId.includes('navigate') ||
                       decisionId.includes('travel') ||
                       decisionId.includes('retrace') ||
                       decisionId.includes('descend');

  if (isNavigation) {
    // Weather visibility impact
    if (scenario.weather === 'storm' || scenario.weather === 'snow') {
      modifier -= 0.45; // Whiteout makes navigation extremely difficult
    } else if (scenario.weather === 'rain') {
      modifier -= 0.20; // Poor visibility
    } else if (scenario.weather === 'wind') {
      modifier -= 0.10; // Reduced visibility
    }

    // Time of day impact on navigation
    if (currentTimeOfDay === 'night') {
      modifier -= 0.15;
    } else if (currentTimeOfDay === 'dusk') {
      modifier -= 0.10;
    }
  }

  // Scouting/searching affected by visibility
  if (decisionId.includes('scout') || decisionId.includes('search')) {
    if (scenario.weather === 'storm' || scenario.weather === 'snow') {
      modifier -= 0.25;
    } else if (scenario.weather === 'rain') {
      modifier -= 0.10;
    }

    if (currentTimeOfDay === 'night') {
      modifier -= 0.20;
    }
  }

  // Shelter building less affected by weather
  if (decisionId === 'shelter' || decisionId.includes('create-windbreak')) {
    if (scenario.weather === 'storm') {
      modifier -= 0.05; // Slightly harder in severe weather
    }
  }

  return modifier;
}

// Calculate player state modifier for success probability
function calculateSuccessPlayerModifier(metrics: PlayerMetrics): number {
  let modifier = 0;
  const { energy, hydration, bodyTemperature } = metrics;

  // Energy impact on performance
  if (energy > 70) {
    modifier += 0.10; // Well-rested bonus
  } else if (energy < 30) {
    modifier -= 0.25; // Critical exhaustion
  } else if (energy < 50) {
    modifier -= 0.15; // Fatigued
  }

  // Hydration impact
  if (hydration > 70) {
    // No modifier (optimal)
  } else if (hydration < 40) {
    modifier -= 0.15; // Severe dehydration
  } else if (hydration < 70) {
    modifier -= 0.05; // Mild dehydration
  }

  // Temperature impact (hypothermia affects coordination)
  if (bodyTemperature < 35) {
    modifier -= 0.20; // Severe hypothermia
  } else if (bodyTemperature < 36.5) {
    modifier -= 0.10; // Mild hypothermia
  } else if (bodyTemperature > 38) {
    modifier -= 0.10; // Hyperthermia
  }

  return modifier;
}

// Calculate success probability for a decision
export function calculateSuccessProbability(decision: Decision, state: GameState): {
  probability: number;
  baseRate: number;
  environmentalModifier: number;
  playerStateModifier: number;
} {
  const baseRate = getBaseSuccessRate(decision.id);
  const envModifier = calculateSuccessEnvironmentalModifier(state, decision.id);
  const playerModifier = calculateSuccessPlayerModifier(state.metrics);

  const probability = Math.max(0.05, Math.min(0.99, baseRate + envModifier + playerModifier));

  return {
    probability,
    baseRate,
    environmentalModifier: envModifier,
    playerStateModifier: playerModifier
  };
}

// Determine risk level based on success probability and costs
function determineRiskLevel(
  successProb: number,
  energyCost: number,
  postEnergy: number,
  postHydration: number,
  postTemp: number
): 'safe' | 'manageable' | 'risky' | 'dangerous' | 'critical' {
  // Critical if post-decision state is life-threatening
  if (postEnergy < 10 || postHydration < 15 || postTemp < 34) {
    return 'critical';
  }

  // Dangerous if very low success and high cost
  if (successProb < 0.35 && energyCost > 40) {
    return 'dangerous';
  }

  // Dangerous if post-decision state is near critical
  if (postEnergy < 20 || postHydration < 25 || postTemp < 35) {
    return 'dangerous';
  }

  // Risky if low success or moderate cost with poor outcome
  if (successProb < 0.50 || (energyCost > 30 && postEnergy < 35)) {
    return 'risky';
  }

  // Manageable if moderate success and acceptable costs
  if (successProb >= 0.50 && postEnergy >= 35 && postHydration >= 40) {
    return 'manageable';
  }

  // Safe if high success and minimal costs
  if (successProb >= 0.70 && postEnergy >= 50 && postHydration >= 50) {
    return 'safe';
  }

  return 'manageable';
}

// Generate warnings based on post-decision state
function generateWarnings(
  postEnergy: number,
  postHydration: number,
  postTemp: number,
  successProb: number
): string[] {
  const warnings: string[] = [];

  if (postEnergy < 10) {
    warnings.push('CRITICAL: Energy would drop to collapse risk levels');
  } else if (postEnergy < 20) {
    warnings.push('WARNING: Energy would become critically low');
  } else if (postEnergy < 30) {
    warnings.push('CAUTION: Energy would drop into dangerous range');
  }

  if (postHydration < 15) {
    warnings.push('CRITICAL: Severe dehydration risk - organ failure possible');
  } else if (postHydration < 25) {
    warnings.push('WARNING: Hydration would become critically low');
  } else if (postHydration < 40) {
    warnings.push('CAUTION: Dehydration would worsen significantly');
  }

  if (postTemp < 34) {
    warnings.push('CRITICAL: Hypothermia imminent - life-threatening');
  } else if (postTemp < 35) {
    warnings.push('WARNING: Body temperature approaching hypothermia threshold');
  } else if (postTemp < 36) {
    warnings.push('CAUTION: Body temperature dropping into danger zone');
  }

  if (successProb < 0.30) {
    warnings.push('VERY RISKY: Less than 30% chance of success');
  } else if (successProb < 0.50) {
    warnings.push('RISKY: Less than 50% chance of success');
  }

  return warnings;
}

// Identify critical thresholds being crossed
function identifyCriticalThresholds(
  currentMetrics: PlayerMetrics,
  postEnergy: number,
  postHydration: number,
  postTemp: number
): string[] {
  const thresholds: string[] = [];

  // Energy thresholds
  if (currentMetrics.energy >= 20 && postEnergy < 20) {
    thresholds.push('Crosses CRITICAL energy threshold (20)');
  } else if (currentMetrics.energy >= 30 && postEnergy < 30) {
    thresholds.push('Crosses DANGEROUS energy threshold (30)');
  }

  // Hydration thresholds
  if (currentMetrics.hydration >= 25 && postHydration < 25) {
    thresholds.push('Crosses CRITICAL hydration threshold (25)');
  } else if (currentMetrics.hydration >= 40 && postHydration < 40) {
    thresholds.push('Crosses DANGEROUS hydration threshold (40)');
  }

  // Temperature thresholds
  if (currentMetrics.bodyTemperature >= 35 && postTemp < 35) {
    thresholds.push('Crosses HYPOTHERMIA threshold (35°C)');
  } else if (currentMetrics.bodyTemperature >= 36 && postTemp < 36) {
    thresholds.push('Crosses DANGEROUS temperature threshold (36°C)');
  }

  return thresholds;
}

// Main calculation function
export function calculateDecisionInfo(decision: Decision, state: GameState): DecisionCalculation {
  const { metrics } = state;

  // Calculate energy cost
  const baseCost = decision.energyCost;
  const envMultiplier = calculateEnvironmentalMultiplier(state);
  const condMultiplier = calculateConditionMultiplier(metrics);
  const energyCost = Math.round(Math.abs(baseCost) * envMultiplier * condMultiplier);

  // Estimate other resource costs
  const activityIntensity = energyCost > 35 ? 3 : energyCost > 20 ? 2 : 1;
  const baseHydrationDrain = Math.ceil(decision.timeRequired / 2);
  const hydrationCost = baseHydrationDrain * activityIntensity +
    (state.scenario.temperature < 10 ? Math.ceil(decision.timeRequired * 1.5) : 0) +
    (state.scenario.temperature > 30 ? Math.ceil(decision.timeRequired * 2) : 0);

  // Temperature change
  let temperatureChange = 0;
  if (!decision.id.includes('shelter') && !decision.id.includes('rest')) {
    if (state.scenario.temperature < 10) {
      temperatureChange = -0.5;
    } else if (state.scenario.temperature > 35) {
      temperatureChange = -0.3;
    }
  }

  // Calculate success probability
  const successCalc = calculateSuccessProbability(decision, state);

  // Post-decision state
  const postEnergy = baseCost < 0 ? metrics.energy - energyCost : metrics.energy + energyCost;
  const postHydration = metrics.hydration - hydrationCost;
  const postTemp = metrics.bodyTemperature + temperatureChange;
  const postMorale = metrics.morale; // Will vary based on success/failure
  const postShelter = metrics.shelter;

  // Risk assessment
  const riskLevel = determineRiskLevel(
    successCalc.probability,
    energyCost,
    postEnergy,
    postHydration,
    postTemp
  );

  const warnings = generateWarnings(postEnergy, postHydration, postTemp, successCalc.probability);
  const criticalThresholds = identifyCriticalThresholds(metrics, postEnergy, postHydration, postTemp);

  return {
    energyCost: baseCost < 0 ? energyCost : -energyCost,
    hydrationCost,
    temperatureChange,
    moraleChange: 0, // Variable based on outcome
    shelterChange: 0,
    riskChange: decision.riskLevel,

    costBreakdown: {
      baseCost: Math.abs(baseCost),
      environmentalMultiplier: envMultiplier,
      conditionMultiplier: condMultiplier,
      finalCost: energyCost
    },

    successProbability: successCalc.probability,
    successFactors: {
      baseRate: successCalc.baseRate,
      environmentalModifier: successCalc.environmentalModifier,
      playerStateModifier: successCalc.playerStateModifier
    },

    postDecisionState: {
      energy: postEnergy,
      hydration: postHydration,
      bodyTemperature: postTemp,
      morale: postMorale,
      shelter: postShelter
    },

    riskLevel,
    warnings,
    criticalThresholds
  };
}

// Get effort level category
export function getEffortLevel(energyCost: number): 'light' | 'moderate' | 'extreme' {
  const cost = Math.abs(energyCost);
  if (cost < 25) return 'light';
  if (cost < 40) return 'moderate';
  return 'extreme';
}

// Get success probability label
export function getSuccessLabel(probability: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (probability >= 0.85) {
    return { label: 'VERY LIKELY', color: 'text-green-400', icon: '✓✓' };
  } else if (probability >= 0.70) {
    return { label: 'LIKELY', color: 'text-green-300', icon: '✓' };
  } else if (probability >= 0.50) {
    return { label: 'CHALLENGING', color: 'text-yellow-400', icon: '⚡' };
  } else if (probability >= 0.30) {
    return { label: 'RISKY', color: 'text-orange-400', icon: '⚠️' };
  } else {
    return { label: 'VERY RISKY', color: 'text-red-400', icon: '⚠️⚠️' };
  }
}
