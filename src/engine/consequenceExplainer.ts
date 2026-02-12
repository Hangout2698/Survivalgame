/**
 * Consequence Explanation Generator
 *
 * Generates detailed, multi-tiered explanations for decision outcomes
 * that show players WHAT happened, WHY it happened, WHAT IT COST, and WHAT IT MEANS
 */

import type {
  GameState,
  Decision,
  ConsequenceExplanation,
  EnvironmentalContext,
  PlayerConditionFactors,
  MetricBreakdown,
  StatChangeReason,
  Weather,
  PlayerMetrics
} from '../types/game';
import { getEducationalFeedback } from './survivalPrinciplesService';

// Determine visibility based on weather
function getVisibility(weather: Weather): 'clear' | 'reduced' | 'poor' | 'whiteout' {
  switch (weather) {
    case 'storm':
    case 'snow':
      return 'whiteout';
    case 'rain':
      return 'poor';
    case 'wind':
      return 'reduced';
    default:
      return 'clear';
  }
}

// Calculate environmental challenge multiplier
function calculateEnvironmentalChallenge(
  weather: Weather,
  temperature: number,
  windSpeed: number,
  timeOfDay: string
): number {
  let multiplier = 1.0;

  // Weather penalties
  if (weather === 'storm' || weather === 'snow') multiplier += 0.4;
  else if (weather === 'rain') multiplier += 0.2;
  else if (weather === 'wind') multiplier += 0.15;

  // Temperature penalties
  if (temperature < 0) multiplier += 0.3;
  else if (temperature < 10) multiplier += 0.2;
  else if (temperature > 35) multiplier += 0.25;

  // Wind penalties
  if (windSpeed > 30) multiplier += 0.2;
  else if (windSpeed > 15) multiplier += 0.1;

  // Time of day penalties
  if (timeOfDay === 'night' || timeOfDay === 'dusk') multiplier += 0.15;

  return multiplier;
}

// Calculate player condition multiplier (penalty for poor condition)
function calculateConditionMultiplier(
  energy: number,
  hydration: number,
  injury: number
): number {
  let multiplier = 1.0;

  // Energy deficiency penalty
  if (energy < 30) multiplier += 0.4;
  else if (energy < 50) multiplier += 0.2;

  // Hydration deficiency penalty
  if (hydration < 30) multiplier += 0.4;
  else if (hydration < 50) multiplier += 0.2;

  // Injury penalty
  if (injury > 50) multiplier += 0.3;
  else if (injury > 30) multiplier += 0.15;

  return multiplier;
}

// Build environmental context
function buildEnvironmentalContext(state: GameState): EnvironmentalContext {
  const { scenario, metrics } = state;

  return {
    weather: scenario.weather,
    temperature: scenario.temperature,
    windSpeed: scenario.windSpeed,
    visibility: getVisibility(scenario.weather),
    timeOfDay: state.currentTimeOfDay,
    shelterQuality: metrics.shelter,
    challengeMultiplier: calculateEnvironmentalChallenge(
      scenario.weather,
      scenario.temperature,
      scenario.windSpeed,
      state.currentTimeOfDay
    )
  };
}

// Build player condition factors
function buildPlayerFactors(state: GameState, recommendedEnergy: number = 60): PlayerConditionFactors {
  const { metrics } = state;

  return {
    energyLevel: metrics.energy,
    hydrationLevel: metrics.hydration,
    bodyTemp: metrics.bodyTemperature,
    injuryStatus: metrics.injurySeverity,
    energyDeficiency: Math.max(0, recommendedEnergy - metrics.energy),
    conditionMultiplier: calculateConditionMultiplier(
      metrics.energy,
      metrics.hydration,
      metrics.injurySeverity
    )
  };
}

// Generate detailed energy breakdown
function generateEnergyBreakdown(
  baseCost: number,
  actualCost: number,
  envContext: EnvironmentalContext,
  playerFactors: PlayerConditionFactors,
  actionType: string
): MetricBreakdown {
  const reasons: StatChangeReason[] = [];

  // Base cost
  reasons.push({
    amount: -baseCost,
    reason: `${actionType} base energy requirement`,
    category: 'base'
  });

  // Environmental penalties
  const envPenalty = Math.round(baseCost * (envContext.challengeMultiplier - 1));
  if (envPenalty > 0) {
    reasons.push({
      amount: -envPenalty,
      reason: `Harsh conditions (${envContext.weather}, ${envContext.temperature}°C, ${envContext.windSpeed} km/h wind)`,
      category: 'environmental'
    });
  }

  // Condition penalties
  const conditionPenalty = Math.round(actualCost - baseCost - envPenalty);
  if (conditionPenalty !== 0) {
    if (playerFactors.energyLevel < 30) {
      reasons.push({
        amount: -Math.abs(conditionPenalty),
        reason: `Exhaustion penalty (energy at ${playerFactors.energyLevel}% - body overcompensating)`,
        category: 'condition'
      });
    } else if (playerFactors.energyLevel < 50) {
      reasons.push({
        amount: -Math.abs(conditionPenalty),
        reason: `Low energy penalty (below optimal performance threshold)`,
        category: 'condition'
      });
    } else if (conditionPenalty < 0) {
      // Bonus (well-rested)
      reasons.push({
        amount: conditionPenalty,
        reason: `Well-rested efficiency bonus`,
        category: 'condition'
      });
    }
  }

  return {
    finalChange: -actualCost,
    reasons,
    calculation: `Base ${baseCost} × ${envContext.challengeMultiplier.toFixed(2)} environment × ${playerFactors.conditionMultiplier.toFixed(2)} condition = ${actualCost}`
  };
}

// Generate hydration breakdown
function generateHydrationBreakdown(
  change: number,
  duration: number,
  activityIntensity: 'rest' | 'light' | 'moderate' | 'extreme',
  envContext: EnvironmentalContext
): MetricBreakdown {
  const reasons: StatChangeReason[] = [];

  // Base metabolic drain
  const baseDrain = -Math.ceil(duration / 2); // -1 per 2 hours
  reasons.push({
    amount: baseDrain,
    reason: `Baseline metabolic water loss over ${duration}h`,
    category: 'base'
  });

  // Activity intensity multiplier
  if (activityIntensity === 'extreme') {
    const activityDrain = baseDrain * 3;
    reasons.push({
      amount: activityDrain,
      reason: `Extreme physical exertion (high metabolism & sweating)`,
      category: 'base'
    });
  } else if (activityIntensity === 'moderate') {
    const activityDrain = baseDrain * 2;
    reasons.push({
      amount: activityDrain,
      reason: `Moderate physical activity`,
      category: 'base'
    });
  }

  // Cold/dry air respiratory loss
  if (envContext.temperature < 10 && activityIntensity !== 'rest') {
    const coldDrain = -Math.ceil(duration * 1.5);
    reasons.push({
      amount: coldDrain,
      reason: `Cold, dry air respiratory evaporation (breathing heavily in cold)`,
      category: 'environmental'
    });
  }

  // Heat exposure dehydration
  if (envContext.temperature > 30 && activityIntensity !== 'rest') {
    const heatDrain = -Math.ceil(duration * 2);
    reasons.push({
      amount: heatDrain,
      reason: `Heat-induced sweating and thermoregulation`,
      category: 'environmental'
    });
  }

  return {
    finalChange: change,
    reasons
  };
}

// Generate temperature breakdown
function generateTemperatureBreakdown(
  change: number,
  envContext: EnvironmentalContext,
  inShelter: boolean,
  activityLevel: 'rest' | 'light' | 'moderate' | 'extreme'
): MetricBreakdown {
  const reasons: StatChangeReason[] = [];

  if (change < 0) {
    // Temperature loss
    if (!inShelter) {
      reasons.push({
        amount: change,
        reason: `Cold exposure (${envContext.temperature}°C ambient, ${envContext.windSpeed} km/h wind)`,
        category: 'environmental'
      });
    } else {
      reasons.push({
        amount: change,
        reason: `Gradual heat loss despite shelter (extended exposure)`,
        category: 'environmental'
      });
    }
  } else if (change > 0) {
    // Temperature gain
    if (activityLevel === 'extreme' || activityLevel === 'moderate') {
      reasons.push({
        amount: change,
        reason: `Metabolic heat generation from physical activity`,
        category: 'base'
      });
    } else if (inShelter) {
      reasons.push({
        amount: change,
        reason: `Gradual warming in protected shelter`,
        category: 'base'
      });
    }
  }

  return {
    finalChange: change,
    reasons
  };
}

// Generate morale breakdown
function generateMoraleBreakdown(
  change: number,
  outcomeType: string,
  decisionSuccess: boolean
): MetricBreakdown {
  const reasons: StatChangeReason[] = [];

  if (decisionSuccess) {
    reasons.push({
      amount: change,
      reason: `Success and sense of accomplishment`,
      category: 'base'
    });
  } else if (change < 0) {
    if (outcomeType === 'critical-failure') {
      reasons.push({
        amount: change,
        reason: `Severe failure - exhausting effort with no progress`,
        category: 'base'
      });
    } else if (outcomeType === 'failure') {
      reasons.push({
        amount: change,
        reason: `Frustration from failed attempt`,
        category: 'base'
      });
    } else {
      reasons.push({
        amount: change,
        reason: `Psychological strain from difficult conditions`,
        category: 'base'
      });
    }
  } else if (change > 0 && !decisionSuccess) {
    reasons.push({
      amount: change,
      reason: `Small morale boost from taking action and staying productive`,
      category: 'base'
    });
  }

  return {
    finalChange: change,
    reasons
  };
}

// Generate risk breakdown
function generateRiskBreakdown(
  change: number,
  outcomeType: string,
  playerFactors: PlayerConditionFactors,
  decisionType: string
): MetricBreakdown {
  const reasons: StatChangeReason[] = [];

  if (change > 0) {
    // Risk increased
    if (outcomeType === 'critical-failure' || outcomeType === 'failure') {
      reasons.push({
        amount: Math.ceil(change * 0.6),
        reason: `Failed objective - no progress toward safety`,
        category: 'base'
      });
    }

    if (playerFactors.energyLevel < 30 || playerFactors.hydrationLevel < 30) {
      reasons.push({
        amount: Math.floor(change * 0.4),
        reason: `Exhausted body in harsh conditions (increased injury/hypothermia risk)`,
        category: 'condition'
      });
    }

    if (decisionType === 'navigation' || decisionType === 'travel') {
      reasons.push({
        amount: Math.floor(change * 0.5),
        reason: `Movement in challenging terrain without confirmed progress`,
        category: 'base'
      });
    }
  } else if (change < 0) {
    // Risk decreased
    if (decisionType === 'shelter') {
      reasons.push({
        amount: change,
        reason: `Improved protection reduces exposure risks`,
        category: 'base'
      });
    } else if (outcomeType === 'success') {
      reasons.push({
        amount: change,
        reason: `Successful progress toward safety`,
        category: 'base'
      });
    }
  }

  return {
    finalChange: change,
    reasons
  };
}

// Generate detailed narrative based on outcome
function generateDetailedNarrative(
  decision: Decision,
  _gameState: GameState,
  metricsChange: Partial<PlayerMetrics>,
  outcomeType: string,
  envContext: EnvironmentalContext,
  playerFactors: PlayerConditionFactors
): string {
  const parts: string[] = [];

  // Environmental setup
  const weatherDesc = envContext.weather === 'snow' || envContext.weather === 'storm'
    ? 'severe whiteout conditions'
    : envContext.weather === 'rain'
    ? 'rainy, low-visibility conditions'
    : envContext.weather === 'wind'
    ? 'high wind conditions'
    : envContext.weather === 'heat'
    ? 'intense heat'
    : 'clear conditions';

  parts.push(`You attempted to ${decision.text.toLowerCase()} in ${weatherDesc}.`);

  // Effort description
  if (decision.timeRequired >= 4) {
    parts.push(`This ${decision.timeRequired}-hour effort required intense focus and continuous physical exertion.`);
  } else if (decision.timeRequired >= 2) {
    parts.push(`Over ${decision.timeRequired} hours, you worked steadily at this task.`);
  }

  // Player condition context
  if (playerFactors.energyLevel < 40) {
    parts.push(`Your energy reserves were already low (${playerFactors.energyLevel}/100), forcing your body to overcompensate and burn additional resources.`);
  }

  // Environmental impact
  if (envContext.temperature < 5 && !decision.id.includes('shelter')) {
    parts.push(`The freezing temperature (${envContext.temperature}°C) and ${envContext.windSpeed} km/h wind created dangerous exposure conditions during the attempt.`);
  } else if (envContext.temperature > 35) {
    parts.push(`The brutal heat (${envContext.temperature}°C) accelerated dehydration and exhaustion.`);
  }

  // Outcome narrative
  if (outcomeType === 'critical-failure') {
    parts.push(`After significant effort, you achieved nothing - no progress, no improvement, wasting critical energy reserves.`);
  } else if (outcomeType === 'failure') {
    parts.push(`The attempt did not succeed, though you gained some understanding of the situation.`);
  } else if (outcomeType === 'success') {
    parts.push(`Your effort paid off, achieving the objective successfully.`);
  } else if (outcomeType === 'partial-success') {
    parts.push(`You made some progress, though not as much as hoped.`);
  }

  // Risk warning
  if (metricsChange.cumulativeRisk && metricsChange.cumulativeRisk > 15) {
    parts.push(`This significantly increased your overall danger level - exhausted bodies in harsh conditions are vulnerable to injury and hypothermia.`);
  }

  return parts.join(' ');
}

// Generate recommendations based on outcome
function generateRecommendations(
  decision: Decision,
  state: GameState,
  outcomeType: string,
  playerFactors: PlayerConditionFactors,
  envContext: EnvironmentalContext
): string[] {
  const recommendations: string[] = [];

  // Energy recommendations
  if (playerFactors.energyLevel < 40 && decision.energyCost > 30) {
    recommendations.push(`Rest to restore energy above 60 before attempting high-effort actions`);
  }

  // Weather recommendations
  if (envContext.visibility === 'whiteout' && decision.id.includes('navigate')) {
    recommendations.push(`Wait for clearer weather before attempting navigation (whiteout = near-zero success chance)`);
  }

  // Shelter recommendations
  if (envContext.shelterQuality < 50 && envContext.temperature < 10) {
    recommendations.push(`Improve shelter before risking travel - it provides critical protection`);
  }

  // Risk management
  if (outcomeType === 'critical-failure' || outcomeType === 'failure') {
    recommendations.push(`Consider lower-risk options that conserve energy while improving position`);
  }

  // Time of day
  if (state.currentTimeOfDay === 'dusk' || state.currentTimeOfDay === 'night') {
    recommendations.push(`Avoid navigation and travel at night - visibility and safety drop dramatically`);
  }

  return recommendations;
}

// Main function: Generate complete explanation
export function generateConsequenceExplanation(
  decision: Decision,
  gameState: GameState,
  metricsChange: Partial<PlayerMetrics>,
  immediateEffect: string,
  decisionQuality?: 'excellent' | 'good' | 'poor' | 'critical-error'
): ConsequenceExplanation {
  // Build context
  const envContext = buildEnvironmentalContext(gameState);
  const playerFactors = buildPlayerFactors(gameState, decision.energyCost > 40 ? 70 : 60);

  // Determine outcome type
  let outcomeType: ConsequenceExplanation['outcomeType'] = 'partial-success';
  if (decisionQuality === 'critical-error') outcomeType = 'critical-failure';
  else if (decisionQuality === 'poor') outcomeType = 'failure';
  else if (decisionQuality === 'excellent') outcomeType = 'success';
  else if (decisionQuality === 'good') outcomeType = 'partial-success';

  // Determine risk assessment
  let riskAssessment: ConsequenceExplanation['riskAssessment'] = 'manageable';
  if (metricsChange.energy && metricsChange.energy < -40 && playerFactors.energyLevel < 50) {
    riskAssessment = 'critical';
  } else if ((metricsChange.cumulativeRisk && metricsChange.cumulativeRisk > 15) || outcomeType === 'critical-failure') {
    riskAssessment = 'dangerous';
  } else if (metricsChange.cumulativeRisk && metricsChange.cumulativeRisk > 8) {
    riskAssessment = 'risky';
  } else if (outcomeType === 'success') {
    riskAssessment = 'safe';
  }

  // Generate metric breakdowns
  const metricBreakdowns: ConsequenceExplanation['metricBreakdowns'] = {};

  if (metricsChange.energy !== undefined) {
    metricBreakdowns.energy = generateEnergyBreakdown(
      decision.energyCost,
      Math.abs(metricsChange.energy),
      envContext,
      playerFactors,
      decision.id.includes('navigate') || decision.id.includes('travel') ? 'Extreme navigation effort' : 'Physical activity'
    );
  }

  if (metricsChange.hydration !== undefined) {
    const activityIntensity: 'rest' | 'light' | 'moderate' | 'extreme' =
      decision.energyCost > 35 ? 'extreme' :
      decision.energyCost > 20 ? 'moderate' :
      decision.energyCost > 10 ? 'light' : 'rest';

    metricBreakdowns.hydration = generateHydrationBreakdown(
      metricsChange.hydration,
      decision.timeRequired,
      activityIntensity,
      envContext
    );
  }

  if (metricsChange.bodyTemperature !== undefined) {
    const inShelter = decision.id.includes('shelter') || decision.id.includes('rest');
    const activityLevel: 'rest' | 'light' | 'moderate' | 'extreme' =
      decision.energyCost > 35 ? 'extreme' :
      decision.energyCost > 20 ? 'moderate' :
      decision.energyCost > 10 ? 'light' : 'rest';

    metricBreakdowns.bodyTemperature = generateTemperatureBreakdown(
      metricsChange.bodyTemperature,
      envContext,
      inShelter,
      activityLevel
    );
  }

  if (metricsChange.morale !== undefined) {
    metricBreakdowns.morale = generateMoraleBreakdown(
      metricsChange.morale,
      outcomeType,
      outcomeType === 'success' || outcomeType === 'partial-success'
    );
  }

  if (metricsChange.cumulativeRisk !== undefined) {
    const decisionType = decision.id.includes('navigate') || decision.id.includes('travel') ? 'navigation' :
                         decision.id.includes('shelter') ? 'shelter' : 'general';

    metricBreakdowns.cumulativeRisk = generateRiskBreakdown(
      metricsChange.cumulativeRisk,
      outcomeType,
      playerFactors,
      decisionType
    );
  }

  // Generate summary
  const summary = riskAssessment === 'critical'
    ? `${immediateEffect} This was an EXTREMELY dangerous decision with your current condition.`
    : riskAssessment === 'dangerous'
    ? `${immediateEffect} This was a high-risk decision that incurred significant costs.`
    : riskAssessment === 'safe'
    ? `${immediateEffect} This was a sound decision that improved your situation.`
    : `${immediateEffect} The outcome was mixed.`;

  // Generate detailed narrative
  const detailedNarrative = generateDetailedNarrative(
    decision,
    gameState,
    metricsChange,
    outcomeType,
    envContext,
    playerFactors
  );

  // Generate recommendations
  const recommendations = generateRecommendations(
    decision,
    gameState,
    outcomeType,
    playerFactors,
    envContext
  );

  // Generate lesson using survival principles
  // Only include if not already shown in this session to avoid repetition
  const quality = decisionQuality || 'good';
  let lessonLearned: string | undefined;

  // Try to get a principle that hasn't been shown yet this session
  const potentialLesson = getEducationalFeedback(decision.id, quality);

  // Import getCurrentSessionPrinciples to check if already shown
  // For now, always include the lesson (repetition filter will be in Game component)
  lessonLearned = potentialLesson || undefined;

  return {
    summary,
    riskAssessment,
    detailedNarrative,
    environmentalFactors: envContext,
    playerFactors,
    outcomeType,
    metricBreakdowns,
    lessonLearned,
    recommendations: recommendations.length > 0 ? recommendations : undefined
  };
}
