import type { PlayerMetrics, Scenario, GameState } from '../types/game';
import { calculateWindEffect } from './windSystem';

export function initializeMetrics(scenario: Scenario): PlayerMetrics {
  let energy = 100;
  let bodyTemperature = 37.0;
  let hydration = 100;
  let injurySeverity = 0;
  let morale = 70;
  let shelter = 0;

  if (scenario.initialCondition.includes('vehicle') || scenario.initialCondition.includes('car')) {
    shelter = 100;
  } else if (scenario.initialCondition.includes('cave') || scenario.initialCondition.includes('building')) {
    shelter = 80;
  } else if (scenario.initialCondition.includes('tree') || scenario.initialCondition.includes('overhang')) {
    shelter = 40;
  } else if (scenario.initialCondition.includes('exposed') || scenario.initialCondition.includes('open')) {
    shelter = 0;
  } else {
    shelter = 20;
  }

  if (scenario.initialCondition.includes('sprained')) {
    injurySeverity = 25;
    energy -= 15;
  } else if (scenario.initialCondition.includes('head injury')) {
    injurySeverity = 30;
    morale -= 20;
    energy -= 10;
  } else if (scenario.initialCondition.includes('exhausted')) {
    energy = 45;
    morale -= 15;
  } else if (scenario.initialCondition.includes('bruised')) {
    injurySeverity = 15;
    energy -= 10;
  } else if (scenario.initialCondition.includes('cold')) {
    bodyTemperature = 36.2;
    energy -= 10;
  } else if (scenario.initialCondition.includes('dehydrated')) {
    hydration = 65;
    energy -= 15;
  }

  if (scenario.equipment.some(e => e.name.includes('Water bottle'))) {
    hydration = Math.min(hydration + 10, 100);
  }

  const signalEffectiveness = calculateSignalEffectiveness(scenario, morale);
  const cumulativeRisk = 0;
  const survivalProbability = calculateSurvivalProbability({
    energy,
    bodyTemperature,
    hydration,
    injurySeverity,
    morale,
    shelter,
    signalEffectiveness,
    cumulativeRisk,
    survivalProbability: 0
  }, scenario);

  return {
    energy,
    bodyTemperature,
    hydration,
    injurySeverity,
    morale,
    shelter,
    signalEffectiveness,
    cumulativeRisk,
    survivalProbability
  };
}

export function updateMetrics(
  current: PlayerMetrics,
  changes: Partial<PlayerMetrics>,
  scenario: Scenario
): PlayerMetrics {
  const updated = {
    energy: clamp(current.energy + (changes.energy || 0), 0, 100),
    bodyTemperature: clamp(current.bodyTemperature + (changes.bodyTemperature || 0), 32, 42),
    hydration: clamp(current.hydration + (changes.hydration || 0), 0, 100),
    injurySeverity: clamp(current.injurySeverity + (changes.injurySeverity || 0), 0, 100),
    morale: clamp(current.morale + (changes.morale || 0), 0, 100),
    shelter: clamp(current.shelter + (changes.shelter || 0), 0, 100),
    signalEffectiveness: 0,
    cumulativeRisk: current.cumulativeRisk + (changes.cumulativeRisk || 0),
    survivalProbability: 0
  };

  updated.signalEffectiveness = calculateSignalEffectiveness(scenario, updated.morale);
  updated.survivalProbability = calculateSurvivalProbability(updated, scenario);

  return updated;
}

export function applyEnvironmentalEffects(
  metrics: PlayerMetrics,
  scenario: Scenario,
  turnNumber: number
): Partial<PlayerMetrics> {
  const changes: Partial<PlayerMetrics> = {
    energy: 0,
    bodyTemperature: 0,
    hydration: 0,
    morale: 0,
    shelter: 0,
    injurySeverity: 0
  };

  const shelterMultiplier = 1 - (metrics.shelter / 100) * 0.85;

  const windEffect = calculateWindEffect(scenario.temperature, scenario.windSpeed);
  const effectiveTemp = windEffect.effectiveTemp;
  const tempDiff = effectiveTemp - 20;

  if (scenario.weather === 'storm' || scenario.weather === 'snow') {
    changes.bodyTemperature = -0.2 * shelterMultiplier;
    changes.energy = -1.4 * shelterMultiplier;
    changes.morale = -1.5 * (1 - (metrics.shelter / 100) * 0.5);
    if (metrics.shelter < 50) {
      changes.shelter = -2;
    }
  } else if (scenario.weather === 'rain') {
    changes.bodyTemperature = -0.15 * shelterMultiplier;
    changes.energy = -1 * shelterMultiplier;
    if (metrics.shelter < 60) {
      changes.shelter = -1.5;
    }
  } else if (scenario.weather === 'heat') {
    changes.hydration = -3 * (1 - (metrics.shelter / 100) * 0.6);
    changes.energy = -1.4 * (1 - (metrics.shelter / 100) * 0.4);
  }

  if (tempDiff < -15) {
    changes.bodyTemperature = (changes.bodyTemperature || 0) - (0.3 * shelterMultiplier);
    changes.energy = (changes.energy || 0) - (2 * shelterMultiplier);
  } else if (tempDiff < -5) {
    changes.bodyTemperature = (changes.bodyTemperature || 0) - (0.15 * shelterMultiplier);
    changes.energy = (changes.energy || 0) - (1 * shelterMultiplier);
  } else if (tempDiff > 15) {
    changes.hydration = (changes.hydration || 0) - (2 * (1 - (metrics.shelter / 100) * 0.5));
    changes.energy = (changes.energy || 0) - (1.4 * (1 - (metrics.shelter / 100) * 0.3));
  }

  if (scenario.timeOfDay === 'night') {
    changes.bodyTemperature = (changes.bodyTemperature || 0) - (0.15 * shelterMultiplier);
    changes.morale = (changes.morale || 0) - (0.5 * (1 - (metrics.shelter / 100) * 0.5));
  }

  changes.hydration = (changes.hydration || 0) - 1.5;
  changes.energy = (changes.energy || 0) - 0.3;

  if (metrics.injurySeverity > 0) {
    changes.energy = (changes.energy || 0) - (metrics.injurySeverity * 0.03);
  }

  if (metrics.hydration < 40) {
    changes.energy = (changes.energy || 0) - 2;
    changes.morale = (changes.morale || 0) - 1.5;
  } else if (metrics.hydration < 60) {
    changes.energy = (changes.energy || 0) - 0.5;
  }

  if (metrics.bodyTemperature < 35) {
    changes.morale = (changes.morale || 0) - 3;
    changes.energy = (changes.energy || 0) - 3;
  } else if (metrics.bodyTemperature > 39) {
    changes.morale = (changes.morale || 0) - 2;
    changes.energy = (changes.energy || 0) - 2;
  }

  if (metrics.morale < 30) {
    changes.cumulativeRisk = 5;
  }

  return changes;
}

function calculateSignalEffectiveness(scenario: Scenario, morale: number): number {
  let effectiveness = 50;

  if (scenario.weather === 'clear') effectiveness += 30;
  if (scenario.weather === 'storm') effectiveness -= 40;
  if (scenario.weather === 'rain' || scenario.weather === 'snow') effectiveness -= 20;

  if (scenario.timeOfDay === 'midday') effectiveness += 20;
  if (scenario.timeOfDay === 'night') effectiveness -= 30;

  if (scenario.environment === 'mountains' || scenario.environment === 'desert') {
    effectiveness += 15;
  }
  if (scenario.environment === 'forest') effectiveness -= 25;

  effectiveness += (morale - 50) * 0.3;

  return clamp(effectiveness, 0, 100);
}

export function calculateSurvivalProbability(
  metrics: PlayerMetrics,
  scenario: Scenario
): number {
  let probability = 50;

  probability += (metrics.energy - 50) * 0.3;
  probability += (metrics.hydration - 50) * 0.4;
  probability += (metrics.morale - 50) * 0.2;

  const tempDeviation = Math.abs(metrics.bodyTemperature - 37);
  probability -= tempDeviation * 8;

  probability -= metrics.injurySeverity * 0.6;

  probability -= metrics.cumulativeRisk * 0.3;

  if (scenario.weather === 'storm') probability -= 15;
  if (scenario.weather === 'snow' && scenario.temperature < -5) probability -= 20;
  if (scenario.weather === 'heat' && scenario.temperature > 35) probability -= 15;

  if (scenario.timeOfDay === 'night') probability -= 10;

  probability -= (scenario.terrainDifficulty - 5) * 3;

  return clamp(probability, 1, 99);
}

export function checkEndConditions(state: GameState): {
  ended: boolean;
  outcome?: 'survived' | 'barely_survived' | 'died';
  reason?: string;
} {
  const m = state.metrics;
  const signalAttempts = state.signalAttempts || 0;
  const successfulSignals = state.successfulSignals || 0;

  if (m.bodyTemperature <= 31.5 || m.bodyTemperature >= 41.5) {
    return {
      ended: true,
      outcome: 'died',
      reason: m.bodyTemperature <= 31.5 ? 'Severe hypothermia' : 'Hyperthermia'
    };
  }

  if (m.energy <= 5 && m.hydration <= 10) {
    return {
      ended: true,
      outcome: 'died',
      reason: 'Complete physical collapse from exhaustion and dehydration'
    };
  }

  if (m.energy <= 3) {
    return {
      ended: true,
      outcome: 'died',
      reason: 'Fatal exhaustion'
    };
  }

  if (m.hydration <= 5) {
    return {
      ended: true,
      outcome: 'died',
      reason: 'Fatal dehydration'
    };
  }

  if (m.injurySeverity >= 90) {
    return {
      ended: true,
      outcome: 'died',
      reason: 'Injury complications'
    };
  }

  const lastOutcome = state.history[state.history.length - 1];
  if (lastOutcome?.wasNavigationSuccess) {
    return {
      ended: true,
      outcome: 'survived',
      reason: 'You successfully navigated to safety!'
    };
  }

  if (state.turnNumber >= 6 && successfulSignals >= 3 && m.signalEffectiveness > 55 && m.survivalProbability > 45) {
    return {
      ended: true,
      outcome: 'survived',
      reason: 'Your persistent signaling paid off. A rescue team spotted you and extracted you safely.'
    };
  }

  if (state.turnNumber >= 4 && successfulSignals >= 2 && m.signalEffectiveness > 65 && m.survivalProbability > 55) {
    return {
      ended: true,
      outcome: 'survived',
      reason: 'Your excellent signaling in favorable conditions was spotted. Rescue helicopter en route!'
    };
  }

  if (state.turnNumber >= 15 && m.survivalProbability > 55) {
    if (m.injurySeverity > 50 || m.hydration < 30 || m.bodyTemperature < 35) {
      return {
        ended: true,
        outcome: 'barely_survived',
        reason: 'Rescue arrived. You survived, but with serious consequences.'
      };
    }
    return {
      ended: true,
      outcome: 'survived',
      reason: 'You maintained discipline. Rescue found you.'
    };
  }

  if (state.turnNumber >= 20) {
    if (m.survivalProbability > 40) {
      return {
        ended: true,
        outcome: 'barely_survived',
        reason: 'You endured until rescue. Recovery will take months.'
      };
    } else {
      return {
        ended: true,
        outcome: 'died',
        reason: 'The accumulation of poor decisions proved fatal.'
      };
    }
  }

  if (m.survivalProbability < 5 && state.turnNumber > 5) {
    return {
      ended: true,
      outcome: 'died',
      reason: 'Your condition deteriorated beyond recovery.'
    };
  }

  return { ended: false };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
