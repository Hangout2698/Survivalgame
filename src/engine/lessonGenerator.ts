import type { GameState, PlayerMetrics } from '../types/game';

interface DecisionPattern {
  type: string;
  count: number;
  details: string[];
}

/**
 * Analyze player's decision history for recurring patterns
 */
export function analyzeDecisionPattern(state: GameState): DecisionPattern[] {
  const patterns: DecisionPattern[] = [];
  const history = state.history;
  const scenario = state.scenario;

  // Pattern 1: Ignored shelter in harsh weather
  const shelterNeglectCount = history.filter((outcome, index) => {
    const turn = index + 1;
    const isHarshWeather = scenario.weather === 'storm' || scenario.weather === 'snow' || scenario.weather === 'rain';
    const lowShelter = turn > 3 && state.metrics.shelter < 40;
    const notShelterDecision = !outcome.decision.id.includes('shelter') && !outcome.decision.id.includes('fortify');
    return isHarshWeather && lowShelter && notShelterDecision;
  }).length;

  if (shelterNeglectCount >= 3) {
    patterns.push({
      type: 'shelter_neglect',
      count: shelterNeglectCount,
      details: [`Ignored shelter ${shelterNeglectCount} times in harsh weather`]
    });
  }

  // Pattern 2: Attempted navigation in poor conditions
  const badNavigationAttempts = history.filter(outcome => {
    const isNavigation = outcome.decision.id.includes('navigate') || outcome.decision.id.includes('backtrack');
    const poorConditions = scenario.weather === 'storm' || scenario.weather === 'snow' || state.metrics.energy < 40;
    return isNavigation && poorConditions;
  }).length;

  if (badNavigationAttempts >= 2) {
    patterns.push({
      type: 'poor_navigation',
      count: badNavigationAttempts,
      details: [`Attempted navigation ${badNavigationAttempts} times in poor conditions`]
    });
  }

  // Pattern 3: Never rested despite low energy
  const restAttempts = history.filter(outcome => outcome.decision.id === 'rest').length;
  const lowEnergyTurns = history.filter((_, index) => {
    if (index === 0) return false;
    const metricsAtTurn = getMetricsAtTurn(state, index);
    return metricsAtTurn.energy < 40;
  }).length;

  if (lowEnergyTurns >= 3 && restAttempts === 0) {
    patterns.push({
      type: 'no_rest',
      count: lowEnergyTurns,
      details: [`Never rested despite ${lowEnergyTurns} turns with low energy`]
    });
  }

  // Pattern 4: Didn't use equipment effectively
  const equipmentNames = state.scenario.equipment.map(e => e.name.toLowerCase());
  const hasFirstAid = equipmentNames.some(n => n.includes('first aid') || n.includes('medical'));
  const hasWater = equipmentNames.some(n => n.includes('water'));
  const hasFireStarter = equipmentNames.some(n => n.includes('lighter') || n.includes('matches'));

  const unusedEquipment: string[] = [];

  if (hasFirstAid && state.metrics.injurySeverity > 30) {
    const firstAidUses = history.filter(o => o.decision.id.includes('treat') || o.decision.id.includes('first-aid')).length;
    if (firstAidUses === 0) {
      unusedEquipment.push('First aid kit available but never used despite injuries');
    }
  }

  if (hasWater && state.metrics.hydration < 50) {
    const waterUses = history.filter(o => o.decision.text.toLowerCase().includes('drink water')).length;
    if (waterUses === 0) {
      unusedEquipment.push('Water bottle available but never used despite dehydration');
    }
  }

  if (hasFireStarter && state.metrics.fireQuality < 30 && state.turnNumber > 5) {
    const fireAttempts = history.filter(o => o.decision.id.includes('fire')).length;
    if (fireAttempts <= 1) {
      unusedEquipment.push('Fire starter available but fire never maintained');
    }
  }

  if (unusedEquipment.length > 0) {
    patterns.push({
      type: 'equipment_unused',
      count: unusedEquipment.length,
      details: unusedEquipment
    });
  }

  // Pattern 5: Took high-risk actions while injured
  const riskyWhileInjured = history.filter((outcome, index) => {
    const metricsAtTurn = getMetricsAtTurn(state, index);
    const isInjured = metricsAtTurn.injurySeverity > 30;
    const isHighRisk = outcome.decision.riskLevel > 5 || outcome.decision.id === 'panic-move';
    return isInjured && isHighRisk;
  }).length;

  if (riskyWhileInjured >= 2) {
    patterns.push({
      type: 'risky_while_injured',
      count: riskyWhileInjured,
      details: [`Took ${riskyWhileInjured} high-risk actions while injured`]
    });
  }

  // Pattern 6: Never found water despite low hydration
  const waterSearches = history.filter(o => o.decision.id.includes('water') || o.decision.id.includes('stream')).length;
  const severeDehydrationTurns = history.filter((_, index) => {
    const metricsAtTurn = getMetricsAtTurn(state, index);
    return metricsAtTurn.hydration < 30;
  }).length;

  if (severeDehydrationTurns >= 3 && waterSearches === 0) {
    patterns.push({
      type: 'no_water_search',
      count: severeDehydrationTurns,
      details: [`Severe dehydration for ${severeDehydrationTurns} turns but never searched for water`]
    });
  }

  // Pattern 7: Neglected fire in cold conditions
  const isCold = scenario.temperature < 5 || scenario.weather === 'snow';
  const fireMaintenanceAttempts = history.filter(o =>
    o.decision.id.includes('fire') || o.decision.id.includes('maintain')
  ).length;

  if (isCold && state.turnNumber > 5 && fireMaintenanceAttempts <= 1 && state.metrics.fireQuality < 30) {
    patterns.push({
      type: 'fire_neglect',
      count: state.turnNumber - fireMaintenanceAttempts,
      details: [`Neglected fire maintenance in ${scenario.temperature}°C conditions`]
    });
  }

  return patterns;
}

/**
 * Generate personalized lessons based on identified patterns
 */
export function generatePersonalizedLessons(state: GameState): string[] {
  const patterns = analyzeDecisionPattern(state);
  const lessons: string[] = [];

  patterns.forEach(pattern => {
    switch (pattern.type) {
      case 'shelter_neglect':
        lessons.push(
          `🏠 Shelter Priority: You ignored shelter in harsh weather ${pattern.count} times. ` +
          `Shelter is your first line of defense against the elements. Build or improve shelter ` +
          `within the first 3 turns in cold/wet conditions.`
        );
        break;

      case 'poor_navigation':
        lessons.push(
          `🧭 Navigation Timing: You attempted navigation ${pattern.count} times in poor conditions. ` +
          `Wait for better weather and ensure you have 60+ energy before attempting navigation. ` +
          `"Stay put" is often the survival principle that saves lives.`
        );
        break;

      case 'no_rest':
        lessons.push(
          `💤 Energy Management: You never rested despite extended low energy. ` +
          `Rest is not optional—it's critical for survival. When energy drops below 40, ` +
          `prioritize rest in shelter over all other actions.`
        );
        break;

      case 'equipment_unused':
        lessons.push(
          `🎒 Resource Utilization: You failed to use available equipment effectively. ` +
          pattern.details.join('. ') + '. ' +
          `Always inventory your equipment and use it proactively, not as a last resort.`
        );
        break;

      case 'risky_while_injured':
        lessons.push(
          `⚕️ Risk Management: You took ${pattern.count} high-risk actions while injured. ` +
          `Injuries compound risk exponentially. Treat injuries immediately and avoid risky ` +
          `decisions until injury severity is below 30.`
        );
        break;

      case 'no_water_search':
        lessons.push(
          `💧 Hydration Priority: You experienced severe dehydration for ${pattern.count} turns ` +
          `without searching for water. Water is a top survival priority. When hydration ` +
          `drops below 60, immediately begin water-finding activities.`
        );
        break;

      case 'fire_neglect':
        lessons.push(
          `🔥 Fire Maintenance: You neglected fire in cold conditions. Fire provides warmth, ` +
          `morale, and signaling capability. In temperatures below 10°C, maintain fire quality ` +
          `above 50 to prevent hypothermia.`
        );
        break;
    }
  });

  // Add generic lessons if no specific patterns found
  if (lessons.length === 0) {
    if (state.outcome === 'died') {
      lessons.push(
        `📚 Survival Fundamentals: Focus on the survival priorities—shelter, water, fire, food, signaling (in that order). ` +
        `Establishing these basics within the first 5 turns significantly improves survival probability.`
      );
    }
  }

  return lessons;
}

/**
 * Identify missed opportunities in player's decisions
 */
export function identifyMissedOpportunities(state: GameState): string[] {
  const opportunities: string[] = [];
  const history = state.history;
  const equipment = state.scenario.equipment;

  // Check if player had fire starter but never built fire early
  const hasFireStarter = equipment.some(e =>
    e.name.toLowerCase().includes('lighter') ||
    e.name.toLowerCase().includes('matches') ||
    e.name.toLowerCase().includes('flint')
  );

  const firstFireTurn = history.findIndex(o => o.decision.id.includes('fire'));

  if (hasFireStarter && (firstFireTurn === -1 || firstFireTurn > 5)) {
    opportunities.push(
      `You had fire-starting equipment but ${firstFireTurn === -1 ? 'never built a fire' : `waited until turn ${firstFireTurn + 1} to build fire`}. ` +
      `Fire should be established within first 3 turns in cold conditions.`
    );
  }

  // Check if player had signaling equipment but never used it effectively
  const hasSignalEquipment = equipment.some(e =>
    e.name.toLowerCase().includes('whistle') ||
    e.name.toLowerCase().includes('mirror') ||
    e.name.toLowerCase().includes('flare')
  );

  const signalAttempts = state.signalAttempts || 0;
  const successfulSignals = state.successfulSignals || 0;

  if (hasSignalEquipment && signalAttempts < 3 && state.turnNumber > 10) {
    opportunities.push(
      `You had signaling equipment but only attempted ${signalAttempts} signals. ` +
      `Persistent signaling (5+ attempts) in favorable conditions is key to rescue.`
    );
  } else if (hasSignalEquipment && successfulSignals >= 2 && successfulSignals < 5 && state.outcome === 'died') {
    opportunities.push(
      `You had ${successfulSignals} successful signals but died before rescue. ` +
      `You needed to survive longer while continuing to signal. Focus on shelter/fire/water to endure until rescue.`
    );
  }

  // Check if player had shelter materials but never fortified
  const hasTarp = equipment.some(e => e.name.toLowerCase().includes('tarp') || e.name.toLowerCase().includes('poncho'));
  const fortifyAttempts = history.filter(o => o.decision.id.includes('fortify') || o.decision.id === 'tarp-shelter').length;

  if (hasTarp && fortifyAttempts === 0 && state.metrics.shelter < 60) {
    opportunities.push(
      `You had tarp/shelter materials but never fortified your shelter. ` +
      `High-quality shelter (70+) dramatically reduces environmental damage.`
    );
  }

  // Check if player had knife but never used it for advanced shelter
  const hasKnife = equipment.some(e => e.name.toLowerCase().includes('knife') || e.name.toLowerCase().includes('tool'));
  const advancedShelterAttempts = history.filter(o =>
    o.decision.id.includes('lean-to') ||
    o.decision.id.includes('debris-hut') ||
    o.decision.id.includes('fortify')
  ).length;

  if (hasKnife && advancedShelterAttempts === 0 && state.turnNumber > 4) {
    opportunities.push(
      `You had a cutting tool but never built advanced shelter. ` +
      `Knives enable debris huts and fortifications that provide superior protection.`
    );
  }

  return opportunities;
}

/**
 * Helper: Get metrics at specific turn
 */
function getMetricsAtTurn(state: GameState, turnIndex: number): PlayerMetrics {
  if (turnIndex === 0) {
    // Return initial metrics
    return state.history[0]?.metricsChange as unknown as PlayerMetrics || state.metrics;
  }

  // Reconstruct metrics by applying all changes up to turnIndex
  let metrics = { ...state.metrics };

  for (let i = 0; i <= turnIndex && i < state.history.length; i++) {
    const outcome = state.history[i];
    const changes = outcome.metricsChange;

    Object.keys(changes).forEach(key => {
      const metricKey = key as keyof PlayerMetrics;
      const currentValue = metrics[metricKey] as number;
      const changeValue = changes[metricKey] as number | undefined;
      if (changeValue !== undefined) {
        (metrics[metricKey] as number) = currentValue + changeValue;
      }
    });
  }

  return metrics;
}
