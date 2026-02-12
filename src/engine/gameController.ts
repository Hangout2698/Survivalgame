import type { GameState, Decision, TimeOfDay, PlayerMetrics, Equipment } from '../types/game';
import { generateScenario } from './scenarioGenerator';
import { initializeMetrics, updateMetrics, checkEndConditions } from './metricsSystem';
import { generateDecisions, applyDecision } from './decisionEngine';
import { analyzeSurvivalPerformance } from './survivalRules';
import { loadActiveSurvivalGuide } from './survivalGuideService';
import { generatePersonalizedLessons, identifyMissedOpportunities } from './lessonGenerator';

// Time constants - extracted to avoid duplication
const TIME_SEQUENCE: TimeOfDay[] = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night'];
const HOURS_PER_PERIOD: Record<TimeOfDay, number> = {
  dawn: 2,
  morning: 4,
  midday: 3,
  afternoon: 4,
  dusk: 2,
  night: 9
};

function progressTime(currentTime: TimeOfDay, hoursToAdd: number): { newTime: TimeOfDay; totalHours: number } {
  const timeSequence = TIME_SEQUENCE;
  const hoursPerPeriod = HOURS_PER_PERIOD;

  let currentIndex = timeSequence.indexOf(currentTime);
  let remainingHours = hoursToAdd;
  let totalHours = 0;

  while (remainingHours > 0) {
    const currentPeriodLength = hoursPerPeriod[timeSequence[currentIndex]];
    if (remainingHours >= currentPeriodLength) {
      remainingHours -= currentPeriodLength;
      totalHours += currentPeriodLength;
      currentIndex = (currentIndex + 1) % timeSequence.length;
    } else {
      totalHours += remainingHours;
      remainingHours = 0;
    }
  }

  return {
    newTime: timeSequence[currentIndex],
    totalHours
  };
}

function calculateTimeUntilDuskOrDawn(currentTime: TimeOfDay): string {
  const timeSequence = TIME_SEQUENCE;
  const hoursPerPeriod = HOURS_PER_PERIOD;

  const currentIndex = timeSequence.indexOf(currentTime);
  const isDaytime = currentTime === 'dawn' || currentTime === 'morning' || currentTime === 'midday' || currentTime === 'afternoon' || currentTime === 'dusk';

  if (isDaytime) {
    let hoursUntilNight = 0;
    for (let i = currentIndex; i < timeSequence.length; i++) {
      if (timeSequence[i] === 'night') break;
      hoursUntilNight += hoursPerPeriod[timeSequence[i]];
    }

    if (hoursUntilNight <= 1) {
      return 'Less than an hour of daylight remains';
    } else if (hoursUntilNight <= 2) {
      return 'Approximately two hours of daylight left';
    } else if (hoursUntilNight <= 4) {
      return `Roughly ${Math.floor(hoursUntilNight)} hours of daylight remaining`;
    } else {
      return `Perhaps ${Math.floor(hoursUntilNight)} hours until darkness`;
    }
  } else {
    const hoursUntilDawn = hoursPerPeriod['night'];
    if (hoursUntilDawn <= 2) {
      return 'Dawn is approaching within the next two hours';
    } else if (hoursUntilDawn <= 4) {
      return 'Dawn is still several hours away';
    } else {
      return `Approximately ${Math.floor(hoursUntilDawn)} hours until first light`;
    }
  }
}

export async function createNewGame(
  providedScenario?: ReturnType<typeof generateScenario>,
  providedEquipment?: Equipment[]
): Promise<GameState> {
  const scenario = providedScenario || generateScenario();
  const metrics = initializeMetrics(scenario);
  const survivalGuide = await loadActiveSurvivalGuide();

  const equipment = providedEquipment || [...scenario.equipment];

  // Calculate current volume used
  const currentVolumeUsed = equipment.reduce((total, item) => total + item.volumeLiters, 0);

  return {
    id: crypto.randomUUID(),
    scenario,
    metrics,
    equipment,
    backpackCapacityLiters: scenario.backpackCapacityLiters,
    currentVolumeUsed,
    turnNumber: 1,
    currentTimeOfDay: scenario.timeOfDay,
    hoursElapsed: 0,
    history: [],
    status: 'active',
    currentEnvironment: scenario.environment,
    survivalGuide,
    signalAttempts: 0,
    successfulSignals: 0,
    goodDecisions: [],
    poorDecisions: []
  };
}

export function makeDecision(state: GameState, decision: Decision): GameState {
  if (state.status !== 'active') {
    return state;
  }

  const outcome = applyDecision(decision, state);

  // Apply any delayed effects that should trigger this turn
  // OPTIMIZATION: Only check recent history (last 5 turns max) since delayed effects are short-term
  // This prevents performance degradation as game history grows to 15-20 turns
  const delayedMetricsChange: Partial<PlayerMetrics> = {};
  const recentHistoryStart = Math.max(0, state.history.length - 5);
  const recentHistory = state.history.slice(recentHistoryStart);

  recentHistory.forEach(pastOutcome => {
    if (pastOutcome.delayedEffects) {
      pastOutcome.delayedEffects.forEach(delayedEffect => {
        if (delayedEffect.turn === state.turnNumber) {
          // Merge delayed effect changes
          const metricsKeys = Object.keys(delayedEffect.metricsChange) as Array<keyof PlayerMetrics>;
          metricsKeys.forEach(metricKey => {
            const currentValue = delayedMetricsChange[metricKey] as number | undefined;
            const changeValue = delayedEffect.metricsChange[metricKey] as number | undefined;
            delayedMetricsChange[metricKey] = ((currentValue || 0) + (changeValue || 0)) as PlayerMetrics[typeof metricKey];
          });
          // Add delayed effect description to consequences
          if (delayedEffect.effect) {
            outcome.consequences.push(delayedEffect.effect);
          }
        }
      });
    }
  });

  // Combine outcome changes with delayed effects
  const combinedMetricsChange = {
    energy: (outcome.metricsChange.energy || 0) + (delayedMetricsChange.energy || 0),
    bodyTemperature: (outcome.metricsChange.bodyTemperature || 0) + (delayedMetricsChange.bodyTemperature || 0),
    hydration: (outcome.metricsChange.hydration || 0) + (delayedMetricsChange.hydration || 0),
    injurySeverity: (outcome.metricsChange.injurySeverity || 0) + (delayedMetricsChange.injurySeverity || 0),
    morale: (outcome.metricsChange.morale || 0) + (delayedMetricsChange.morale || 0),
    shelter: (outcome.metricsChange.shelter || 0) + (delayedMetricsChange.shelter || 0),
    cumulativeRisk: (outcome.metricsChange.cumulativeRisk || 0) + (delayedMetricsChange.cumulativeRisk || 0)
  };

  const { metrics: updatedMetrics, thresholdCrossing } = updateMetrics(
    state.metrics,
    combinedMetricsChange,
    state.scenario,
    state.turnNumber,
    decision.text,
    decision.id
  );

  // Store threshold crossings for causality tracking
  const updatedCrossings = [...(state.metricThresholdCrossings || [])];
  if (thresholdCrossing) {
    updatedCrossings.push(thresholdCrossing);
  }

  const timeProgression = progressTime(state.currentTimeOfDay, decision.timeRequired);

  let updatedSignalAttempts = state.signalAttempts || 0;
  let updatedSuccessfulSignals = state.successfulSignals || 0;
  const updatedGoodDecisions = [...(state.goodDecisions || [])];
  const updatedPoorDecisions = [...(state.poorDecisions || [])];

  if (outcome.wasSignalAttempt) {
    updatedSignalAttempts += 1;
  }
  if (outcome.wasSuccessfulSignal) {
    updatedSuccessfulSignals += 1;
  }

  if (outcome.decisionQuality === 'excellent' || outcome.decisionQuality === 'good') {
    updatedGoodDecisions.push({
      turn: state.turnNumber,
      description: decision.text,
      principle: outcome.survivalPrincipleAlignment || ''
    });
  } else if (outcome.decisionQuality === 'poor' || outcome.decisionQuality === 'critical-error') {
    updatedPoorDecisions.push({
      turn: state.turnNumber,
      description: decision.text,
      principle: outcome.survivalPrincipleAlignment || ''
    });
  }

  // Update principle alignment score
  let updatedAlignmentScore = state.principleAlignmentScore ?? 50; // Start at neutral
  const qualityDelta: Record<string, number> = {
    'excellent': 8,
    'good': 3,
    'poor': -5,
    'critical-error': -12
  };
  if (outcome.decisionQuality) {
    updatedAlignmentScore = Math.max(0, Math.min(100,
      updatedAlignmentScore + (qualityDelta[outcome.decisionQuality] || 0)
    ));
  }

  // Initialize discovered principles set
  let updatedDiscoveredPrinciples = state.discoveredPrinciples || new Set<string>();

  // Track principle discovery on good/excellent decisions
  if ((outcome.decisionQuality === 'excellent' || outcome.decisionQuality === 'good')
      && outcome.survivalPrincipleAlignment) {
    const principle = outcome.survivalPrincipleAlignment;

    if (!updatedDiscoveredPrinciples.has(principle)) {
      updatedDiscoveredPrinciples = new Set(updatedDiscoveredPrinciples);
      updatedDiscoveredPrinciples.add(principle);

      // Show unlock notification
      const principleTitle = principle.split(':')[0] || principle.substring(0, 30);
      outcome.consequences.push(`🎓 New principle discovered: ${principleTitle}`);
    }
  }

  let updatedEquipment = [...state.equipment];

  if (outcome.equipmentChanges) {
    if (outcome.equipmentChanges.removed) {
      outcome.equipmentChanges.removed.forEach(itemName => {
        const index = updatedEquipment.findIndex(e => e.name === itemName);
        if (index !== -1) {
          updatedEquipment.splice(index, 1);
        }
      });
    }

    if (outcome.equipmentChanges.added) {
      updatedEquipment = [...updatedEquipment, ...outcome.equipmentChanges.added];
    }

    if (outcome.equipmentChanges.updated) {
      outcome.equipmentChanges.updated.forEach(updatedItem => {
        const index = updatedEquipment.findIndex(e => e.name === updatedItem.name);
        if (index !== -1) {
          updatedEquipment[index] = updatedItem;
        }
      });
    }
  }

  // Recalculate current volume used after equipment changes
  const updatedVolumeUsed = updatedEquipment.reduce((total, item) => total + item.volumeLiters, 0);

  const newState: GameState = {
    ...state,
    metrics: updatedMetrics,
    equipment: updatedEquipment,
    currentVolumeUsed: updatedVolumeUsed,
    turnNumber: state.turnNumber + 1,
    currentTimeOfDay: timeProgression.newTime,
    hoursElapsed: state.hoursElapsed + timeProgression.totalHours,
    history: [...state.history, outcome],
    currentEnvironment: outcome.environmentChange || state.currentEnvironment,
    survivalGuide: state.survivalGuide,
    signalAttempts: updatedSignalAttempts,
    successfulSignals: updatedSuccessfulSignals,
    goodDecisions: updatedGoodDecisions,
    poorDecisions: updatedPoorDecisions,
    principleAlignmentScore: updatedAlignmentScore,
    discoveredPrinciples: updatedDiscoveredPrinciples,
    metricThresholdCrossings: updatedCrossings
  };

  const endCheck = checkEndConditions(newState);

  if (endCheck.ended) {
    const analysis = analyzeSurvivalPerformance(newState);

    // Generate personalized lessons based on player patterns
    const personalizedLessons = generatePersonalizedLessons(newState);
    const missedOpportunities = identifyMissedOpportunities(newState);

    // Build lessons array, filtering out empty strings and removing duplicates
    const allLessons = [
      endCheck.reason || '',
      ...personalizedLessons,
      ...missedOpportunities,
      ...analysis.lessons
    ]
      .filter(lesson => lesson && lesson.trim().length > 0) // Remove empty/whitespace
      .filter((lesson, index, self) => self.indexOf(lesson) === index); // Remove duplicates

    return {
      ...newState,
      status: 'ended',
      outcome: endCheck.outcome,
      lessons: allLessons,
      keyMoments: identifyKeyMoments(newState),
      causalityChain: endCheck.causalityChain
    };
  }

  return newState;
}

export function getAvailableDecisions(state: GameState): Decision[] {
  if (state.status !== 'active') {
    return [];
  }

  return generateDecisions(state);
}

function identifyKeyMoments(state: GameState): Array<{
  turn: number;
  description: string;
  impact: 'positive' | 'negative' | 'critical';
}> {
  const moments: Array<{
    turn: number;
    description: string;
    impact: 'positive' | 'negative' | 'critical';
  }> = [];

  state.history.forEach((outcome, index) => {
    const turn = index + 1;
    const energyChange = outcome.metricsChange.energy || 0;
    const riskChange = outcome.metricsChange.cumulativeRisk || 0;
    const injuryChange = outcome.metricsChange.injurySeverity || 0;

    if (outcome.decision.id === 'panic-move') {
      moments.push({
        turn,
        description: 'You panicked and moved recklessly',
        impact: 'critical'
      });
    } else if (energyChange < -40) {
      moments.push({
        turn,
        description: 'A decision cost far more energy than expected',
        impact: 'negative'
      });
    } else if (riskChange > 15) {
      moments.push({
        turn,
        description: 'You took a high-risk action',
        impact: 'negative'
      });
    } else if (injuryChange > 20) {
      moments.push({
        turn,
        description: 'You sustained a serious injury',
        impact: 'critical'
      });
    } else if (outcome.decision.id === 'shelter' || outcome.decision.id === 'fortify') {
      if (turn <= 3) {
        moments.push({
          turn,
          description: 'You prioritized shelter early',
          impact: 'positive'
        });
      }
    }
  });

  return moments.slice(0, 5);
}

export function getCurrentSituation(state: GameState): string {
  const { metrics, scenario, turnNumber, currentTimeOfDay } = state;

  let situation = '';

  if (turnNumber === 1) {
    return 'You assess your situation and consider your options.';
  }

  const timeInfo = calculateTimeUntilDuskOrDawn(currentTimeOfDay);
  situation += `${timeInfo}. `;

  const hasShelter = metrics.shelter && metrics.shelter > 0;

  if (hasShelter) {
    if (metrics.shelter > 60) {
      situation += 'Your shelter provides solid protection. ';
    } else if (metrics.shelter > 30) {
      situation += 'Your shelter offers basic protection. ';
    } else {
      situation += 'Your makeshift shelter is minimal. ';
    }
  } else {
    if (currentTimeOfDay === 'dusk' || currentTimeOfDay === 'night') {
      situation += 'You remain exposed to the elements. ';
    }
  }

  if (metrics.energy < 15) {
    situation += 'You are on the verge of complete exhaustion. Every movement is agony. ';
  } else if (metrics.energy < 30) {
    situation += 'You are becoming dangerously exhausted. ';
  } else if (metrics.energy < 50) {
    situation += 'Fatigue is setting in. ';
  }

  if (metrics.hydration < 15) {
    situation += 'Extreme dehydration is affecting your consciousness. Your tongue is swollen. ';
  } else if (metrics.hydration < 30) {
    situation += 'Severe thirst clouds your thinking. ';
  } else if (metrics.hydration < 50) {
    situation += 'You are getting thirsty. ';
  }

  if (metrics.bodyTemperature < 33) {
    situation += 'Severe hypothermia. Your body is shutting down. ';
  } else if (metrics.bodyTemperature < 35) {
    situation += 'You are shivering uncontrollably. ';
  } else if (metrics.bodyTemperature > 40) {
    situation += 'Dangerous hyperthermia. Your vision swims. ';
  } else if (metrics.bodyTemperature > 39) {
    situation += 'You feel feverish and disoriented. ';
  } else if (metrics.bodyTemperature < 36) {
    situation += 'The cold is affecting you. ';
  }

  if (metrics.injurySeverity > 70) {
    situation += 'Your injuries are life-threatening. ';
  } else if (metrics.injurySeverity > 50) {
    situation += 'Your injuries are severe. ';
  } else if (metrics.injurySeverity > 25) {
    situation += 'Pain from your injuries persists. ';
  }

  if (metrics.morale < 30) {
    situation += 'Despair is taking hold. ';
  } else if (metrics.morale < 50) {
    situation += 'Your spirits are low. ';
  }

  if (scenario.weather === 'storm') {
    situation += 'The storm continues to rage. ';
  } else if (scenario.weather === 'snow') {
    situation += 'Snow falls steadily. ';
  }

  if (situation === timeInfo + '. ') {
    situation += 'You maintain awareness of your surroundings and remain alert. ';
  }

  return situation;
}
