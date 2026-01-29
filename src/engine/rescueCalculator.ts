/**
 * Rescue Calculator
 *
 * Calculates rescue probability and provides detailed rescue status information
 */

import type { GameState } from '../types/game';

export interface RescueStatus {
  signalAttempts: number;
  successfulSignals: number;
  requiredSignals: number;
  rescueProbability: number;
  estimatedTurnsToRescue: number | null;
  activeWinConditions: Array<{
    type: 'signal' | 'navigate' | 'endure';
    progress: number; // 0-100
    description: string;
    turnsRemaining?: number;
  }>;
}

/**
 * Calculate comprehensive rescue status
 */
export function calculateRescueStatus(state: GameState): RescueStatus {
  const signalAttempts = state.signalAttempts || 0;
  const successfulSignals = state.successfulSignals || 0;
  const m = state.metrics;

  // Base rescue probability from signals
  let rescueProbability = 0;

  // Signal-based rescue probability (requires both signals AND sufficient turns)
  if (successfulSignals > 0 && state.turnNumber >= 10) {
    // Reduced multiplier since we need 5 signals now
    rescueProbability = Math.min(85, successfulSignals * 15 + m.signalEffectiveness * 0.3);
  } else if (successfulSignals > 0) {
    // Very low probability before turn 10 - rescue teams haven't started searching yet
    rescueProbability = Math.min(15, successfulSignals * 3);
  }

  // Adjust for visibility conditions
  if (state.scenario.weather === 'clear' && state.scenario.timeOfDay === 'midday') {
    rescueProbability += 10;
  } else if (state.scenario.weather === 'storm' || state.scenario.weather === 'snow') {
    rescueProbability -= 15;
  }

  // Night reduces rescue probability
  if (state.scenario.timeOfDay === 'night') {
    rescueProbability -= 20;
  }

  // High ground helps
  if (state.currentEnvironment === 'mountains' && m.shelter > 50) {
    rescueProbability += 5;
  }

  rescueProbability = Math.max(0, Math.min(100, rescueProbability));

  // Calculate active win conditions
  const activeWinConditions: Array<{
    type: 'signal' | 'navigate' | 'endure';
    progress: number;
    description: string;
    turnsRemaining?: number;
  }> = [];

  // Signal-based rescue condition (requires 5 signals and turn 12+)
  const requiredSignalsForRescue = 5;
  const signalProgress = Math.min(100, (successfulSignals / requiredSignalsForRescue) * 100);
  const turnProgress = Math.min(100, (state.turnNumber / 12) * 100);
  const combinedSignalProgress = Math.min(100, (signalProgress + turnProgress) / 2);

  activeWinConditions.push({
    type: 'signal',
    progress: combinedSignalProgress,
    description: state.turnNumber < 12
      ? `Survive to turn 12, then send ${requiredSignalsForRescue} signals (${successfulSignals}/${requiredSignalsForRescue} signals, turn ${state.turnNumber}/12)`
      : `Send ${requiredSignalsForRescue - successfulSignals} more successful signal${requiredSignalsForRescue - successfulSignals !== 1 ? 's' : ''} (${successfulSignals}/${requiredSignalsForRescue})`,
    turnsRemaining: successfulSignals >= requiredSignalsForRescue && state.turnNumber >= 12 ? 0 : undefined
  });

  // Navigation condition (harder to track, show as potential)
  if (state.turnNumber > 5) {
    activeWinConditions.push({
      type: 'navigate',
      progress: Math.min(100, state.turnNumber * 8),
      description: 'Successfully navigate to safety through decisive action'
    });
  }

  // Endure condition
  const endureTurnsNeeded = 15;
  const endureProgress = Math.min(100, (state.turnNumber / endureTurnsNeeded) * 100);
  const survivalCheck = m.survivalProbability > 55;

  activeWinConditions.push({
    type: 'endure',
    progress: endureProgress,
    description: survivalCheck
      ? `Survive ${endureTurnsNeeded - state.turnNumber} more turn${endureTurnsNeeded - state.turnNumber !== 1 ? 's' : ''} (${state.turnNumber}/${endureTurnsNeeded})`
      : `Survive to turn ${endureTurnsNeeded} with 55+ survival probability (currently ${m.survivalProbability.toFixed(0)}%)`,
    turnsRemaining: state.turnNumber >= endureTurnsNeeded ? 0 : endureTurnsNeeded - state.turnNumber
  });

  // Estimate turns to rescue
  let estimatedTurnsToRescue: number | null = null;

  // Account for minimum turn requirement
  const turnsUntilMinimum = Math.max(0, 12 - state.turnNumber);

  if (successfulSignals >= 5 && state.turnNumber >= 12) {
    estimatedTurnsToRescue = Math.ceil((100 - rescueProbability) / 15); // Rescue likely soon
  } else if (successfulSignals >= 3 && m.signalEffectiveness > 60) {
    estimatedTurnsToRescue = turnsUntilMinimum + Math.ceil((5 - successfulSignals) * 1.5);
  } else if (state.turnNumber < endureTurnsNeeded) {
    estimatedTurnsToRescue = Math.max(turnsUntilMinimum, endureTurnsNeeded - state.turnNumber);
  }

  return {
    signalAttempts,
    successfulSignals,
    requiredSignals: 5, // Updated from 3 to 5
    rescueProbability,
    estimatedTurnsToRescue,
    activeWinConditions
  };
}

/**
 * Get rescue probability description
 */
export function getRescueProbabilityDescription(probability: number): string {
  if (probability >= 85) return 'Imminent';
  if (probability >= 70) return 'Very High';
  if (probability >= 50) return 'Good';
  if (probability >= 30) return 'Moderate';
  if (probability >= 15) return 'Low';
  return 'Very Low';
}
