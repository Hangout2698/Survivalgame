import type { Decision, GameState, DecisionOutcome } from '../types/game';
import { applyEnvironmentalEffects } from './metricsSystem';
import { extractRelevantGuidance, generateGuidanceBasedFeedback } from './survivalGuideService';
import {
  getEducationalFeedback,
  searchPrinciples
} from './survivalPrinciplesService';
import { generateConsequenceExplanation } from './consequenceExplainer';

// Calculate success bonus based on principle alignment score
function calculateSuccessBonus(state: GameState): number {
  const alignment = state.principleAlignmentScore ?? 50;

  // Players learning from principles get better odds
  if (alignment >= 80) return 0.15; // +15% success chance
  if (alignment >= 65) return 0.10; // +10%
  if (alignment >= 50) return 0.05; // +5%
  if (alignment < 35) return -0.08; // -8% (repeating mistakes)

  return 0;
}

function scaleEnergyCost(baseCost: number, riskLevel: number, state: GameState): number {
  const { energy, hydration, injurySeverity } = state.metrics;

  if (baseCost < 0) return baseCost;

  if (riskLevel <= 2 && baseCost <= 20) {
    if (energy >= 70 && hydration >= 60 && injurySeverity < 20) {
      return Math.max(5, baseCost * 0.6);
    } else if (energy >= 50 && hydration >= 50) {
      return baseCost * 0.8;
    }
  }

  if (energy < 30 || hydration < 30 || injurySeverity > 50) {
    return baseCost * 1.4;
  } else if (energy < 50 || hydration < 50 || injurySeverity > 30) {
    return baseCost * 1.2;
  }

  return baseCost;
}

// Helper function to determine decision quality based on game state
function determineQuality(
  decision: Decision,
  state: GameState,
  _outcome: DecisionOutcome
): 'excellent' | 'good' | 'poor' | 'critical-error' {
  const { metrics, scenario, turnNumber } = state;

  // Critical errors
  if (decision.id === 'panic-move') return 'critical-error';

  // Excellent decisions
  if (decision.id === 'shelter' && turnNumber <= 3) return 'excellent';
  if ((decision.id === 'use-whistle' || decision.id === 'use-mirror' || decision.id === 'use-flashlight-signal' || decision.id === 'signal-fire')
      && metrics.signalEffectiveness > 60) return 'excellent';
  if ((decision.id === 'treat-injury-full' || decision.id === 'treat-injury-partial')
      && metrics.injurySeverity > 50) return 'excellent';
  if ((decision.id === 'start-fire-lighter' || decision.id === 'start-fire-matches' || decision.id === 'start-fire-friction')
      && (scenario.temperature < 10 || metrics.bodyTemperature < 36)) return 'excellent';
  if (decision.id === 'use-blanket' && metrics.bodyTemperature < 35.5) return 'excellent';

  // Poor decisions
  if (decision.riskLevel >= 8
      && (metrics.energy < 50 || metrics.injurySeverity > 30)) return 'poor';
  if ((decision.id.includes('descend') || decision.id.includes('navigate') || decision.id.includes('travel'))
      && scenario.timeOfDay === 'night') return 'poor';
  if ((decision.id.includes('travel') || decision.id.includes('descend'))
      && (scenario.weather === 'storm' || scenario.weather === 'snow')) return 'poor';
  if (decision.id === 'scout' && metrics.energy < 35) return 'poor';

  // Good by default
  return 'good';
}

// Fallback if database doesn't have a principle
function getPrincipleFromContext(
  decision: Decision,
  state: GameState,
  quality: string
): string {
  // Use searchPrinciples to find contextually relevant principle
  const keywords = [decision.id, state.scenario.environment, quality];
  const results = searchPrinciples(keywords.join(' '));

  if (results.length > 0) {
    return results[0].principle;
  }

  return 'Responding appropriately to the situation is key to survival.';
}

function evaluateDecisionQuality(decision: Decision, state: GameState, outcome: DecisionOutcome): {
  quality: 'excellent' | 'good' | 'poor' | 'critical-error';
  principle: string;
} {
  // Determine quality based on game state
  const quality = determineQuality(decision, state, outcome);

  // Get principle from database
  const principle = getEducationalFeedback(decision.id, quality)
    || getPrincipleFromContext(decision, state, quality);

  return { quality, principle };
}

function getEnvironmentSpecificDecisions(state: GameState): Decision[] {
  const { scenario, metrics, turnNumber, currentEnvironment } = state;
  const decisions: Decision[] = [];

  switch (currentEnvironment) {
    case 'mountains':
      decisions.push({
        id: 'shelter',
        text: 'Improve shelter and wait for rescue',
        energyCost: 15,
        riskLevel: 1,
        timeRequired: 2
      });

      if (metrics.energy > 40 && turnNumber < 8) {
        decisions.push({
          id: 'retrace-trail',
          text: 'Retrace your steps to find the trail',
          energyCost: 35,
          riskLevel: 5,
          timeRequired: 3
        });
      }

      if (metrics.energy > 45 && turnNumber < 6) {
        decisions.push({
          id: 'descend',
          text: 'Descend carefully toward lower elevation',
          energyCost: 40,
          riskLevel: 7,
          timeRequired: 4
        });
      }

      if (metrics.energy > 25) {
        decisions.push({
          id: 'find-landmark',
          text: 'Climb to higher ground to spot landmarks',
          energyCost: 30,
          riskLevel: 4,
          timeRequired: 2
        });
      }
      break;

    case 'coast':
      decisions.push({
        id: 'shelter',
        text: 'Build shelter above tide line',
        energyCost: 15,
        riskLevel: 1,
        timeRequired: 2
      });

      if (metrics.energy > 40 && turnNumber < 8) {
        decisions.push({
          id: 'follow-coast',
          text: 'Travel north along coast toward trail',
          energyCost: 35,
          riskLevel: 6,
          timeRequired: 3
        });
      }

      if (metrics.energy > 25) {
        decisions.push({
          id: 'scout-inland',
          text: 'Scout inland for easier route',
          energyCost: 25,
          riskLevel: 4,
          timeRequired: 2
        });
      }

      decisions.push({
        id: 'signal-water',
        text: 'Create visible signal for boats',
        energyCost: 20,
        riskLevel: 2,
        timeRequired: 1
      });
      break;

    case 'desert':
      decisions.push({
        id: 'shelter',
        text: 'Find shade and conserve energy',
        energyCost: 10,
        riskLevel: 1,
        timeRequired: 2
      });

      if (metrics.energy > 45 && scenario.timeOfDay !== 'midday' && scenario.timeOfDay !== 'afternoon') {
        decisions.push({
          id: 'travel-west',
          text: 'Travel west toward highway',
          energyCost: 45,
          riskLevel: 8,
          timeRequired: 4
        });
      }

      if (metrics.energy > 40 && turnNumber < 6) {
        decisions.push({
          id: 'backtrack-vehicle',
          text: 'Backtrack toward your vehicle',
          energyCost: 40,
          riskLevel: 6,
          timeRequired: 3
        });
      }

      if (metrics.energy > 25) {
        decisions.push({
          id: 'scout-shade',
          text: 'Search for water sources or shade',
          energyCost: 30,
          riskLevel: 5,
          timeRequired: 2
        });
      }
      break;

    case 'forest':
      decisions.push({
        id: 'shelter',
        text: 'Build shelter and wait',
        energyCost: 15,
        riskLevel: 1,
        timeRequired: 2
      });

      if (metrics.energy > 40 && turnNumber < 8) {
        decisions.push({
          id: 'search-trail',
          text: 'Search systematically for the trail',
          energyCost: 35,
          riskLevel: 5,
          timeRequired: 3
        });
      }

      if (metrics.energy > 30) {
        decisions.push({
          id: 'follow-stream',
          text: 'Follow terrain downhill to find streams',
          energyCost: 30,
          riskLevel: 4,
          timeRequired: 3
        });
      }

      if (metrics.energy > 25) {
        decisions.push({
          id: 'call-out',
          text: 'Call out and listen for your group',
          energyCost: 15,
          riskLevel: 1,
          timeRequired: 1
        });
      }
      break;

    case 'tundra':
      decisions.push({
        id: 'shelter',
        text: 'Create wind break and wait out weather',
        energyCost: 20,
        riskLevel: 1,
        timeRequired: 2
      });

      if (metrics.energy > 50 && scenario.weather !== 'storm' && scenario.weather !== 'snow') {
        decisions.push({
          id: 'navigate-camp',
          text: 'Navigate south-southwest toward camp',
          energyCost: 50,
          riskLevel: 9,
          timeRequired: 4
        });
      }

      if (metrics.energy > 30 && (scenario.weather === 'clear' || scenario.weather === 'wind')) {
        decisions.push({
          id: 'retrace-tracks',
          text: 'Try to retrace your tracks',
          energyCost: 35,
          riskLevel: 7,
          timeRequired: 3
        });
      }
      break;

    case 'urban-edge':
      decisions.push({
        id: 'shelter',
        text: 'Find safe shelter in structures',
        energyCost: 15,
        riskLevel: 2,
        timeRequired: 2
      });

      if (metrics.energy > 40 && turnNumber < 8) {
        decisions.push({
          id: 'find-exit',
          text: 'Navigate toward populated areas',
          energyCost: 35,
          riskLevel: 5,
          timeRequired: 3
        });
      }

      if (metrics.energy > 30) {
        decisions.push({
          id: 'climb-vantage',
          text: 'Climb structure for vantage point',
          energyCost: 25,
          riskLevel: 6,
          timeRequired: 2
        });
      }

      decisions.push({
        id: 'signal-urban',
        text: 'Create visible signal or noise',
        energyCost: 15,
        riskLevel: 1,
        timeRequired: 1
      });
      break;
  }

  return decisions;
}

function getEquipmentBasedDecisions(state: GameState): Decision[] {
  const decisions: Decision[] = [];
  const { equipment, scenario, metrics } = state;

  if (equipment.some(e => e.name.toLowerCase().includes('whistle'))) {
    decisions.push({
      id: 'use-whistle',
      text: 'Use whistle to signal for help',
      energyCost: 10,
      riskLevel: 1,
      timeRequired: 1
    });
  }

  if (equipment.some(e => e.name.toLowerCase().includes('signal mirror') || e.name.toLowerCase().includes('mirror'))) {
    if (scenario.timeOfDay === 'midday' || scenario.timeOfDay === 'morning' || scenario.timeOfDay === 'afternoon') {
      decisions.push({
        id: 'use-mirror',
        text: 'Use signal mirror to attract attention',
        energyCost: 15,
        riskLevel: 1,
        timeRequired: 1
      });
    }
  }

  if (equipment.some(e => e.name.toLowerCase().includes('flashlight'))) {
    if (scenario.timeOfDay === 'night' || scenario.timeOfDay === 'dusk') {
      decisions.push({
        id: 'use-flashlight-scout',
        text: 'Use flashlight to scout area carefully',
        energyCost: 20,
        riskLevel: 2,
        timeRequired: 2
      });
    }
    decisions.push({
      id: 'use-flashlight-signal',
      text: 'Use flashlight to signal for rescue',
      energyCost: 10,
      riskLevel: 1,
      timeRequired: 1
    });
  }

  if (equipment.some(e => e.name.toLowerCase().includes('emergency blanket') || e.name.toLowerCase().includes('blanket'))) {
    if (scenario.temperature < 15 || scenario.weather === 'snow' || scenario.weather === 'storm') {
      decisions.push({
        id: 'use-blanket',
        text: 'Use emergency blanket for warmth',
        energyCost: 10,
        riskLevel: 1,
        timeRequired: 1
      });
    }
  }

  if (equipment.some(e => e.name.toLowerCase().includes('lighter') || e.name.toLowerCase().includes('matches'))) {
    if (!equipment.some(e => e.name.toLowerCase().includes('firewood'))) {
      decisions.push({
        id: 'gather-start-fire',
        text: 'Gather materials and start fire with lighter',
        energyCost: 30,
        riskLevel: 3,
        timeRequired: 3
      });
    }
  }

  if (equipment.some(e => e.name.toLowerCase().includes('knife'))) {
    decisions.push({
      id: 'use-knife-shelter',
      text: 'Use knife to improve shelter construction',
      energyCost: 25,
      riskLevel: 2,
      timeRequired: 2
    });
  }

  if (equipment.some(e => e.name.toLowerCase().includes('rope'))) {
    if (state.currentEnvironment === 'mountains' && metrics.energy > 40) {
      decisions.push({
        id: 'use-rope-descend',
        text: 'Use rope to safely descend steep terrain',
        energyCost: 35,
        riskLevel: 4,
        timeRequired: 3
      });
    }
  }

  if (equipment.some(e => e.name.toLowerCase().includes('water') || e.name.toLowerCase().includes('bottle'))) {
    decisions.push({
      id: 'drink',
      text: 'Drink water supply',
      energyCost: 5,
      riskLevel: 1,
      timeRequired: 1
    });
  }

  if (metrics.injurySeverity > 0) {
    const hasFirstAid = equipment.some(e => e.name.toLowerCase().includes('first aid'));
    const hasBandages = equipment.some(e => e.name.toLowerCase().includes('bandage'));
    const hasAntiseptic = equipment.some(e => e.name.toLowerCase().includes('antiseptic') || e.name.toLowerCase().includes('alcohol'));

    if (hasFirstAid) {
      decisions.push({
        id: 'treat-injury-full',
        text: 'Treat injuries thoroughly with first aid kit',
        energyCost: 10,
        riskLevel: 1,
        timeRequired: 1
      });
    } else if (hasBandages || hasAntiseptic) {
      decisions.push({
        id: 'treat-injury-partial',
        text: 'Treat injuries with available medical supplies',
        energyCost: 12,
        riskLevel: 2,
        timeRequired: 1
      });
    }

    if (metrics.injurySeverity > 20 && !hasFirstAid) {
      decisions.push({
        id: 'improvise-treatment',
        text: 'Improvise treatment with whatever is available',
        energyCost: 15,
        riskLevel: 3,
        timeRequired: 2
      });
    }
  }

  if (equipment.some(e => e.name.toLowerCase().includes('energy bar') || e.name.toLowerCase().includes('berries') || e.name.toLowerCase().includes('food'))) {
    decisions.push({
      id: 'eat-food',
      text: 'Eat food to restore energy',
      energyCost: 5,
      riskLevel: 1,
      timeRequired: 1
    });
  }

  return decisions;
}

function getFireManagementDecisions(state: GameState): Decision[] {
  const { equipment, metrics } = state;
  const decisions: Decision[] = [];

  const hasTinder = equipment.some(e => e.name.toLowerCase().includes('tinder'));
  const hasKindling = equipment.some(e => e.name.toLowerCase().includes('kindling'));
  const hasFuelLogs = equipment.some(e => e.name.toLowerCase().includes('fuel log'));
  const hasLighter = equipment.some(e => e.name.toLowerCase().includes('lighter'));
  const hasMatches = equipment.some(e => e.name.toLowerCase().includes('matches'));

  // Gathering materials
  if (metrics.energy > 20) {
    decisions.push({
      id: 'gather-tinder',
      text: 'Gather tinder (dry grass, bark)',
      energyCost: 8,
      riskLevel: 1,
      timeRequired: 1
    });
  }

  if (metrics.energy > 25) {
    decisions.push({
      id: 'gather-firewood',
      text: 'Gather firewood (kindling and logs)',
      energyCost: 15,
      riskLevel: 2,
      timeRequired: 2
    });
  }

  // Starting fire (only if fire is low/extinguished)
  if (metrics.fireQuality < 30) {
    if (hasLighter && hasTinder) {
      decisions.push({
        id: 'start-fire-lighter',
        text: 'Start fire with lighter',
        energyCost: 5,
        riskLevel: 1,
        timeRequired: 1
      });
    }

    if (hasMatches && hasTinder) {
      decisions.push({
        id: 'start-fire-matches',
        text: 'Start fire with matches',
        energyCost: 8,
        riskLevel: 2,
        timeRequired: 1
      });
    }

    if (metrics.energy > 30 && !hasLighter && !hasMatches) {
      decisions.push({
        id: 'start-fire-friction',
        text: 'Start fire by friction (exhausting)',
        energyCost: 25,
        riskLevel: 4,
        timeRequired: 3
      });
    }
  }

  // Maintaining fire (only if fire exists)
  if (metrics.fireQuality > 0 && metrics.fireQuality < 95) {
    if (hasKindling) {
      decisions.push({
        id: 'add-fuel-small',
        text: 'Add kindling to fire',
        energyCost: 3,
        riskLevel: 1,
        timeRequired: 1
      });
    }

    if (hasFuelLogs) {
      decisions.push({
        id: 'add-fuel-large',
        text: 'Add fuel log to fire',
        energyCost: 4,
        riskLevel: 1,
        timeRequired: 1
      });
    }

    decisions.push({
      id: 'tend-fire',
      text: 'Tend fire (rearrange coals)',
      energyCost: 2,
      riskLevel: 1,
      timeRequired: 1
    });
  }

  // Signal fire (requires strong fire)
  if (metrics.fireQuality > 50) {
    decisions.push({
      id: 'signal-fire',
      text: 'Add green branches for smoke signal',
      energyCost: 8,
      riskLevel: 2,
      timeRequired: 2
    });
  }

  return decisions;
}

function getWaterPurificationDecisions(state: GameState): Decision[] {
  const { equipment, metrics } = state;
  const decisions: Decision[] = [];

  const hasEmptyBottle = equipment.some(e => e.name.toLowerCase().includes('water bottle (empty)'));
  const hasUntreatedWater = equipment.some(e => e.name.toLowerCase().includes('water bottle (untreated)'));
  const hasCleanWater = equipment.some(e => e.name.toLowerCase().includes('water bottle (clean)') ||
    (e.name.toLowerCase().includes('water bottle') && !e.name.toLowerCase().includes('empty') && !e.name.toLowerCase().includes('untreated')));

  // Collecting water
  if ((hasEmptyBottle || !equipment.some(e => e.name.toLowerCase().includes('water bottle'))) && metrics.energy > 15) {
    decisions.push({
      id: 'collect-water',
      text: 'Find and collect water',
      energyCost: 12,
      riskLevel: 2,
      timeRequired: 2
    });
  }

  // Purifying water
  if (hasUntreatedWater && metrics.fireQuality > 50) {
    decisions.push({
      id: 'boil-water',
      text: 'Boil water to purify',
      energyCost: 8,
      riskLevel: 1,
      timeRequired: 2
    });
  }

  // Drinking water
  if (hasCleanWater) {
    decisions.push({
      id: 'drink-clean-water',
      text: 'Drink clean water',
      energyCost: 2,
      riskLevel: 1,
      timeRequired: 1
    });
  }

  if (hasUntreatedWater && metrics.hydration < 40) {
    decisions.push({
      id: 'drink-untreated-water',
      text: 'Drink untreated water (risky)',
      energyCost: 2,
      riskLevel: 5,
      timeRequired: 1
    });
  }

  return decisions;
}

export function generateDecisions(state: GameState): Decision[] {
  const { scenario, metrics, turnNumber } = state;
  const decisions: Decision[] = [];

  const environmentDecisions = getEnvironmentSpecificDecisions(state);
  decisions.push(...environmentDecisions);

  const equipmentDecisions = getEquipmentBasedDecisions(state);
  decisions.push(...equipmentDecisions);

  const fireDecisions = getFireManagementDecisions(state);
  decisions.push(...fireDecisions);

  const waterDecisions = getWaterPurificationDecisions(state);
  decisions.push(...waterDecisions);

  if (metrics.energy > 25 && state.currentEnvironment !== 'desert') {
    decisions.push({
      id: 'scout',
      text: 'Scout immediate area for resources',
      energyCost: 25,
      riskLevel: 3,
      timeRequired: 2
    });
  }

  decisions.push({
    id: 'rest',
    text: 'Rest to recover energy',
    energyCost: -25,
    riskLevel: 1,
    timeRequired: 2
  });

  if (scenario.weather === 'storm' || scenario.weather === 'snow') {
    decisions.push({
      id: 'fortify',
      text: 'Fortify shelter against weather',
      energyCost: 30,
      riskLevel: 2,
      timeRequired: 3
    });
  }

  if (turnNumber > 5 && metrics.morale < 40 && metrics.energy > 45) {
    decisions.push({
      id: 'panic-move',
      text: 'Push desperately toward help',
      energyCost: 50,
      riskLevel: 9,
      timeRequired: 4
    });
  }

  return decisions.slice(0, 6);
}

export function applyDecision(decision: Decision, state: GameState): DecisionOutcome {
  const consequences: string[] = [];
  let metricsChange: any = {};
  let equipmentChanges: any = {};
  let immediateEffect = '';
  const delayedEffects: any[] = [];
  let environmentChange: any = undefined;

  // Apply success bonus based on principle alignment
  const successBonus = calculateSuccessBonus(state);
  const roll = Math.random() + successBonus;
  const actualEnergyCost = scaleEnergyCost(decision.energyCost, decision.riskLevel, state);

  // Calculate additional hydration cost for working during hot conditions
  // Principle: "Ration sweat, not water - work during cooler hours to conserve water"
  let additionalHydrationCost = 0;
  if (actualEnergyCost > 15) { // High-energy activities only
    if (state.scenario.timeOfDay === 'midday' || state.scenario.timeOfDay === 'afternoon') {
      if (state.scenario.weather === 'heat' || state.scenario.temperature > 30) {
        additionalHydrationCost = -6; // Major penalty for hard work in heat
      } else if (state.scenario.temperature > 20) {
        additionalHydrationCost = -3; // Moderate penalty for warm conditions
      }
    }

    // Desert environment amplifies hydration loss
    if (state.currentEnvironment === 'desert') {
      additionalHydrationCost -= 2;
    }
  }

  const guidance = state.survivalGuide
    ? extractRelevantGuidance(state.survivalGuide, state, 'outcome')
    : '';

  const guidanceFeedback = state.survivalGuide
    ? generateGuidanceBasedFeedback(guidance, decision.id)
    : [];

  switch (decision.id) {
    case 'shelter':
      const shelterIncrease = state.metrics.shelter < 70 ? 25 : 15;
      metricsChange = {
        energy: -actualEnergyCost,
        bodyTemperature: state.scenario.temperature < 15 ? 0.3 : 0.1,
        morale: 5,
        shelter: shelterIncrease,
        cumulativeRisk: -2
      };
      immediateEffect = 'You gather materials and improve your shelter.';
      consequences.push('Your protection from the elements increases.');
      consequences.push('You feel slightly more in control.');
      break;

    case 'signal':
      metricsChange = {
        energy: -actualEnergyCost,
        morale: roll > 0.7 ? 8 : 2
      };
      if (state.metrics.signalEffectiveness > 60 && roll > 0.5) {
        immediateEffect = 'You create a visible signal. It might be seen.';
        consequences.push('Your signal is well-positioned.');
        metricsChange.cumulativeRisk = -5;
      } else {
        immediateEffect = 'You prepare a signal, though visibility is poor.';
        consequences.push('The conditions limit effectiveness.');
      }
      break;

    case 'retrace-trail':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -7,
        cumulativeRisk: 8
      };

      if (roll > 0.7) {
        immediateEffect = 'You find markers you recognize. You are getting closer to the trail.';
        consequences.push('Your navigation is paying off.');
        metricsChange.morale = 15;
        metricsChange.cumulativeRisk = -10;
      } else if (roll > 0.4) {
        immediateEffect = 'You move carefully but cannot be certain you are heading the right way.';
        consequences.push('The terrain all looks similar.');
        metricsChange.morale = -2;
      } else {
        immediateEffect = 'You lose more elevation than intended. This does not feel right.';
        consequences.push('You may have gone the wrong direction.');
        metricsChange.morale = -8;
        metricsChange.cumulativeRisk = 5;
      }
      break;

    case 'descend':
      // Principle: "Travel during daylight hours to avoid injury and conserve energy"
      const isNightDescend = state.scenario.timeOfDay === 'night' || state.scenario.timeOfDay === 'dusk';
      const nightPenalty = isNightDescend ? 1.5 : 1.0; // 50% more danger at night

      metricsChange = {
        energy: -decision.energyCost * nightPenalty,
        hydration: -10,
        cumulativeRisk: 12 * nightPenalty
      };

      if (isNightDescend) {
        consequences.push('Descending in low light is extremely dangerous.');
      }

      // Night increases injury chance significantly
      const injuryThreshold = isNightDescend ? 0.40 : 0.25;

      if (roll < injuryThreshold) {
        metricsChange.injurySeverity = isNightDescend ? 30 : 20; // Worse injuries at night
        immediateEffect = isNightDescend
          ? 'You cannot see the terrain clearly and fall hard in the darkness.'
          : 'You slip on loose rock. The fall is hard.';
        consequences.push('You are injured and shaken.');
        metricsChange.morale = -15;
        delayedEffects.push({
          turn: state.turnNumber + 2,
          effect: 'The injury from your fall is worsening.',
          metricsChange: { energy: -12, morale: -8 }
        });
      } else if (roll > 0.8 && state.turnNumber > 6) {
        immediateEffect = 'You descend carefully and spot signs of a trail below.';
        consequences.push('You might have found a way down.');
        metricsChange.morale = 12;
        metricsChange.cumulativeRisk = -8;
        if (roll > 0.9) {
          environmentChange = 'forest';
          consequences.push('The elevation drops into forested terrain.');
        }
      } else {
        immediateEffect = 'You descend slowly. The terrain is challenging.';
        consequences.push('Progress is exhausting but steady.');
        metricsChange.morale = -4;
        if (roll > 0.6 && state.turnNumber > 4) {
          environmentChange = 'forest';
          consequences.push('You reach lower elevation among trees.');
        }
      }
      break;

    case 'find-landmark':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -6,
        cumulativeRisk: 3
      };

      if (roll > 0.6) {
        immediateEffect = 'From higher ground you spot a valley you recognize.';
        consequences.push('You now have better sense of direction.');
        metricsChange.morale = 10;
        metricsChange.cumulativeRisk = -6;
      } else if (roll > 0.3) {
        immediateEffect = 'You climb but visibility is poor. No useful landmarks visible.';
        consequences.push('The effort did not help much.');
        metricsChange.morale = -4;
      } else {
        immediateEffect = 'The climb exposes you to wind. You see nothing helpful.';
        consequences.push('You are colder and no better oriented.');
        metricsChange.bodyTemperature = -0.5;
        metricsChange.morale = -6;
      }
      break;

    case 'follow-coast':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -8,
        cumulativeRisk: 10
      };

      if (roll > 0.75) {
        immediateEffect = 'You navigate the coast and spot the trail access point ahead.';
        consequences.push('You are close to safety.');
        metricsChange.morale = 18;
        metricsChange.cumulativeRisk = -15;
        if (roll > 0.85) {
          environmentChange = 'forest';
          consequences.push('The landscape transitions to coastal forest.');
        }
      } else if (roll < 0.3) {
        immediateEffect = 'The tide cuts off your route. You must backtrack.';
        consequences.push('You lost time and energy.');
        metricsChange.energy = -15;
        metricsChange.morale = -10;
      } else {
        immediateEffect = 'You make progress along the rocky coast.';
        consequences.push('The route is slow but passable.');
        metricsChange.morale = 2;
      }
      break;

    case 'scout-inland':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -5,
        cumulativeRisk: 5
      };

      if (roll > 0.6) {
        immediateEffect = 'You find a gentler route inland that bypasses the rocks.';
        consequences.push('This route looks more promising.');
        metricsChange.morale = 8;
        if (roll > 0.75) {
          environmentChange = 'forest';
          consequences.push('You move into the treeline.');
        }
      } else {
        immediateEffect = 'The inland route is thick with brush. No advantage.';
        consequences.push('You return to the coast.');
        metricsChange.morale = -3;
      }
      break;

    case 'signal-water':
      metricsChange = {
        energy: -actualEnergyCost,
        morale: 4
      };
      if (roll > 0.6) {
        immediateEffect = 'You arrange rocks and debris into a visible pattern.';
        consequences.push('It might be seen from the water or air.');
        metricsChange.cumulativeRisk = -4;
      } else {
        immediateEffect = 'You create a signal but conditions limit visibility.';
        consequences.push('It may not help.');
      }
      break;

    case 'travel-west':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -15,
        cumulativeRisk: 15
      };

      if (roll > 0.8 && state.turnNumber > 5) {
        immediateEffect = 'Through heat haze you spot structures in the distance.';
        consequences.push('The highway might be within reach.');
        metricsChange.morale = 15;
        metricsChange.cumulativeRisk = -12;
      } else if (roll < 0.3) {
        immediateEffect = 'The heat is brutal. You make little progress.';
        consequences.push('You are severely dehydrated.');
        metricsChange.energy = -15;
        metricsChange.hydration = -10;
        metricsChange.morale = -12;
      } else {
        immediateEffect = 'You walk west. Landmarks remain distant and unclear.';
        consequences.push('You are not sure if this helps.');
        metricsChange.morale = -5;
      }
      break;

    case 'backtrack-vehicle':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -9,
        cumulativeRisk: 8
      };

      if (roll > 0.7) {
        immediateEffect = 'You recognize terrain features. The vehicle is this direction.';
        consequences.push('You are retracing your path correctly.');
        metricsChange.morale = 10;
        metricsChange.cumulativeRisk = -8;
      } else {
        immediateEffect = 'You walk back but nothing looks familiar.';
        consequences.push('You may be going the wrong way.');
        metricsChange.morale = -7;
      }
      break;

    case 'scout-shade':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -7,
        cumulativeRisk: 6
      };

      if (roll > 0.7) {
        immediateEffect = 'You find a rock overhang with shade.';
        consequences.push('You can rest out of the sun.');
        metricsChange.morale = 8;
        metricsChange.bodyTemperature = -0.4;
      } else if (roll > 0.5) {
        immediateEffect = 'You find scattered cacti but no water source.';
        consequences.push('The search was not fruitful.');
        metricsChange.morale = -2;
      } else {
        immediateEffect = 'The search exhausts you with no reward.';
        consequences.push('You found nothing useful.');
        metricsChange.morale = -6;
      }
      break;

    case 'search-trail':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -7,
        cumulativeRisk: 7
      };

      if (roll > 0.75) {
        immediateEffect = 'You find trail markers through the trees.';
        consequences.push('You have found the trail.');
        metricsChange.morale = 20;
        metricsChange.cumulativeRisk = -15;
      } else if (roll > 0.4) {
        immediateEffect = 'You search methodically but find no clear trail.';
        consequences.push('The forest remains confusing.');
        metricsChange.morale = -4;
        if (roll > 0.55 && state.currentEnvironment === 'mountains') {
          environmentChange = 'forest';
          consequences.push('Your search brings you into denser woods.');
        }
      } else {
        immediateEffect = 'You become more disoriented during the search.';
        consequences.push('You are not sure where you are now.');
        metricsChange.morale = -10;
        metricsChange.cumulativeRisk = 5;
      }
      break;

    case 'follow-stream':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -6,
        cumulativeRisk: 5
      };

      if (roll > 0.6) {
        immediateEffect = 'You follow terrain down and find a stream.';
        consequences.push('Fresh water and a landmark.');
        metricsChange.morale = 12;
        equipmentChanges.added = [{ name: 'Water bottle (full)', quantity: 1, condition: 'good' as const }];
      } else {
        immediateEffect = 'You descend but find no water.';
        consequences.push('The terrain is difficult.');
        metricsChange.morale = -3;
      }
      break;

    case 'call-out':
      metricsChange = {
        energy: -actualEnergyCost,
        morale: 2
      };

      if (roll > 0.8 && state.turnNumber < 6) {
        immediateEffect = 'You hear a faint response in the distance.';
        consequences.push('Your group might be nearby.');
        metricsChange.morale = 15;
        metricsChange.cumulativeRisk = -10;
      } else {
        immediateEffect = 'You call out. Only silence answers.';
        consequences.push('No one is within earshot.');
        metricsChange.morale = -2;
      }
      break;

    case 'navigate-camp':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -12,
        bodyTemperature: -0.8,
        cumulativeRisk: 18
      };

      if (roll > 0.75 && state.turnNumber > 4) {
        immediateEffect = 'Through a break in weather you spot camp structures.';
        consequences.push('You navigated correctly. Safety is ahead.');
        metricsChange.morale = 25;
        metricsChange.cumulativeRisk = -20;
      } else if (roll < 0.35) {
        immediateEffect = 'Visibility drops to zero. You stop, disoriented and freezing.';
        consequences.push('You may have walked past camp.');
        metricsChange.morale = -18;
        metricsChange.bodyTemperature = -0.5;
        metricsChange.injurySeverity = 10;
      } else {
        immediateEffect = 'You travel through whiteout. Direction is uncertain.';
        consequences.push('You cannot confirm you are heading the right way.');
        metricsChange.morale = -8;
      }
      break;

    case 'retrace-tracks':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -8,
        bodyTemperature: -0.4,
        cumulativeRisk: 10
      };

      if (roll > 0.65) {
        immediateEffect = 'You find your earlier tracks and follow them back.';
        consequences.push('You are retracing your path.');
        metricsChange.morale = 12;
        metricsChange.cumulativeRisk = -8;
      } else {
        immediateEffect = 'Wind has erased most tracks. You guess at direction.';
        consequences.push('You are not confident in your heading.');
        metricsChange.morale = -6;
      }
      break;

    case 'find-exit':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -7,
        cumulativeRisk: 8
      };

      if (roll > 0.7) {
        immediateEffect = 'You find a gap in the fencing that leads to streets.';
        consequences.push('You can see people and traffic ahead.');
        metricsChange.morale = 20;
        metricsChange.cumulativeRisk = -15;
      } else if (roll < 0.3) {
        immediateEffect = 'You encounter a barrier you cannot pass. Must backtrack.';
        consequences.push('You wasted time and energy.');
        metricsChange.morale = -10;
        metricsChange.energy = -10;
        if (roll < 0.15) {
          environmentChange = 'forest';
          consequences.push('You end up in overgrown wasteland.');
        }
      } else {
        immediateEffect = 'You navigate through debris toward populated areas.';
        consequences.push('Progress is slow but you are moving the right direction.');
        metricsChange.morale = 4;
      }
      break;

    case 'climb-vantage':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -4,
        cumulativeRisk: 8
      };

      if (roll > 0.6) {
        immediateEffect = 'From elevation you spot active streets to the west.';
        consequences.push('You now know which direction to go.');
        metricsChange.morale = 10;
        metricsChange.cumulativeRisk = -6;
      } else if (roll < 0.25) {
        immediateEffect = 'The structure shifts under you. You barely avoid falling.';
        consequences.push('That was dangerous.');
        metricsChange.morale = -8;
        metricsChange.injurySeverity = 8;
      } else {
        immediateEffect = 'You climb up but buildings block most sightlines.';
        consequences.push('You learned little.');
        metricsChange.morale = -2;
      }
      break;

    case 'signal-urban':
      metricsChange = {
        energy: -actualEnergyCost,
        morale: 3
      };

      if (roll > 0.65) {
        immediateEffect = 'You hear a distant response. Someone heard you.';
        consequences.push('Help might be coming.');
        metricsChange.morale = 12;
        metricsChange.cumulativeRisk = -8;
      } else {
        immediateEffect = 'You make noise and set up markers. No response.';
        consequences.push('The area seems deserted.');
      }
      break;

    case 'scout':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -4
      };

      if (roll > 0.75) {
        immediateEffect = 'You find a stream with fresh water!';
        consequences.push('You can refill your water supply.');
        metricsChange.morale = 10;
        equipmentChanges.added = [{ name: 'Water bottle (full)', quantity: 1, condition: 'good' as const }];
      } else if (roll > 0.6) {
        immediateEffect = 'You find some dry firewood and tinder.';
        consequences.push('This could help with warmth.');
        metricsChange.morale = 6;
        equipmentChanges.added = [{ name: 'Firewood bundle', quantity: 1, condition: 'good' as const }];
      } else if (roll > 0.4) {
        immediateEffect = 'You find some edible berries.';
        consequences.push('A small food source helps morale.');
        metricsChange.morale = 4;
        equipmentChanges.added = [{ name: 'Berries (handful)', quantity: 1, condition: 'good' as const }];
      } else if (roll > 0.2) {
        immediateEffect = 'You scout the area but find little of value.';
        consequences.push('At least you know what is nearby.');
        metricsChange.morale = -3;
      } else {
        immediateEffect = 'The scouting effort yields nothing useful.';
        consequences.push('You wasted energy for no gain.');
        metricsChange.morale = -6;
        metricsChange.cumulativeRisk = 3;
      }
      break;

    case 'rest':
      const shelterBonus = Math.floor(state.metrics.shelter / 20);
      const baseEnergyGain = -decision.energyCost;
      const totalEnergyGain = baseEnergyGain + shelterBonus;

      metricsChange = {
        energy: totalEnergyGain,
        morale: 5
      };

      if (state.metrics.shelter > 50) {
        immediateEffect = 'You rest in your shelter. Your energy recovers well.';
        consequences.push('Good shelter allows for effective rest.');
      } else {
        immediateEffect = 'You rest and focus on staying calm.';
        consequences.push('Your energy recovers, but conditions are challenging.');
      }

      if (state.scenario.weather === 'storm' && state.metrics.shelter < 40) {
        metricsChange.bodyTemperature = -0.3;
        consequences.push('The harsh weather makes rest difficult.');
      }
      break;

    case 'drink':
      const waterItem = state.equipment.find(e => e.name.includes('Water') || e.name.includes('water'));
      metricsChange = {
        energy: -actualEnergyCost,
        hydration: 25,
        morale: 4
      };
      immediateEffect = 'You drink your water supply.';
      consequences.push('You feel better. The water is now gone.');
      if (waterItem) {
        equipmentChanges.removed = [waterItem.name];
      }
      break;

    case 'fortify':
      metricsChange = {
        energy: -decision.energyCost,
        bodyTemperature: 0.5,
        morale: 8,
        shelter: 30,
        cumulativeRisk: -5
      };
      immediateEffect = 'You reinforce your shelter against the harsh conditions.';
      consequences.push('Your protection improves significantly.');
      break;

    case 'panic-move':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -12,
        morale: -15,
        cumulativeRisk: 20
      };
      immediateEffect = 'Desperation drives you forward. You move recklessly.';
      consequences.push('You push past exhaustion.');
      if (roll < 0.5) {
        metricsChange.injurySeverity = 25;
        consequences.push('You fall hard. Something might be broken.');
        delayedEffects.push({
          turn: state.turnNumber + 1,
          effect: 'The injury from your fall is worse than you realized.',
          metricsChange: { energy: -15, morale: -10, injurySeverity: 15 }
        });
      } else {
        consequences.push('You cover ground but have no idea if you are heading the right direction.');
      }
      break;

    case 'treat-injury-full':
      const firstAidItem = state.equipment.find(e => e.name.includes('First aid') || e.name.includes('first aid'));
      const healingAmount = state.metrics.injurySeverity > 50 ? -25 : -20;
      metricsChange = {
        energy: -actualEnergyCost,
        injurySeverity: healingAmount,
        morale: 8
      };
      immediateEffect = 'You carefully treat your injuries with the first aid kit.';
      consequences.push('The wound is properly cleaned, disinfected, and bandaged.');
      consequences.push('Pain and infection risk are significantly reduced.');
      if (firstAidItem) {
        equipmentChanges.removed = [firstAidItem.name];
      }
      break;

    case 'treat-injury-partial':
      const bandageItem = state.equipment.find(e => e.name.toLowerCase().includes('bandage'));
      const antisepticItem = state.equipment.find(e => e.name.toLowerCase().includes('antiseptic') || e.name.toLowerCase().includes('alcohol'));
      const hasBoth = bandageItem && antisepticItem;
      const partialHealAmount = hasBoth ? -15 : -10;

      metricsChange = {
        energy: -actualEnergyCost,
        injurySeverity: partialHealAmount,
        morale: hasBoth ? 6 : 4
      };

      if (hasBoth) {
        immediateEffect = 'You clean the wound with antiseptic and apply fresh bandages.';
        consequences.push('The treatment is effective with the supplies you have.');
        equipmentChanges.removed = [bandageItem.name, antisepticItem.name];
      } else if (antisepticItem) {
        immediateEffect = 'You disinfect the wound but lack proper bandages.';
        consequences.push('The antiseptic helps prevent infection.');
        equipmentChanges.removed = [antisepticItem.name];
      } else {
        immediateEffect = 'You apply bandages to your injuries.';
        consequences.push('The bleeding is controlled but the wound needs cleaning.');
        if (bandageItem) {
          equipmentChanges.removed = [bandageItem.name];
        }
      }
      break;

    case 'improvise-treatment':
      metricsChange = {
        energy: -actualEnergyCost,
        injurySeverity: roll > 0.7 ? -12 : roll > 0.4 ? -7 : -3,
        morale: roll > 0.6 ? 4 : 2
      };
      if (roll > 0.7) {
        immediateEffect = 'You improvise bandages from clean clothing and create a compress.';
        consequences.push('Your makeshift treatment is surprisingly effective.');
        consequences.push('The bleeding stops and pressure helps with the pain.');
      } else if (roll > 0.4) {
        immediateEffect = 'You do what you can with available materials.';
        consequences.push('The makeshift treatment provides some relief.');
        consequences.push('It is better than nothing but far from ideal.');
      } else {
        immediateEffect = 'Your improvised treatment is barely effective.';
        consequences.push('Without proper supplies, you can only manage basic care.');
        metricsChange.injurySeverity = -3;
        metricsChange.morale = 0;
      }
      break;

    case 'eat-food':
      const foodItem = state.equipment.find(e => e.name.includes('Energy bar') || e.name.includes('Berries') || e.name.toLowerCase().includes('food'));
      const isEnergyBar = foodItem?.name.includes('Energy bar');
      const energyGain = isEnergyBar ? 30 : 18;

      metricsChange = {
        energy: energyGain - decision.energyCost,
        morale: isEnergyBar ? 8 : 5,
        hydration: isEnergyBar ? 0 : -2
      };

      immediateEffect = isEnergyBar
        ? 'You eat an energy bar. Your energy increases significantly.'
        : 'You eat the berries. They provide nourishment.';
      consequences.push(`You gain ${energyGain} energy.`);

      if (foodItem) {
        if (foodItem.quantity > 1) {
          equipmentChanges.updated = [{
            ...foodItem,
            quantity: foodItem.quantity - 1
          }];
          consequences.push(`You have ${foodItem.quantity - 1} remaining.`);
        } else {
          equipmentChanges.removed = [foodItem.name];
          consequences.push('That was your last food.');
        }
      }
      break;

    // Fire gathering
    case 'gather-tinder':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -2,
        morale: 3
      };
      if (roll > 0.7) {
        immediateEffect = 'You find excellent dry tinder - grass, bark, and pine needles.';
        consequences.push('This tinder will catch fire easily.');
        equipmentChanges.added = [{ name: 'Tinder bundle', quantity: 2, condition: 'good' as const }];
      } else {
        immediateEffect = 'You gather some usable tinder from the area.';
        consequences.push('It should be enough to start a fire.');
        equipmentChanges.added = [{ name: 'Tinder bundle', quantity: 1, condition: 'good' as const }];
      }
      break;

    case 'gather-firewood':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -4,
        morale: 5
      };
      if (roll > 0.6) {
        immediateEffect = 'You gather quality firewood - both kindling and larger fuel.';
        consequences.push('You collect a good supply of dry wood.');
        equipmentChanges.added = [
          { name: 'Kindling sticks', quantity: 3, condition: 'good' as const },
          { name: 'Fuel logs', quantity: 1, condition: 'good' as const }
        ];
      } else {
        immediateEffect = 'You find some firewood, though not as much as you hoped.';
        consequences.push('The wood quality is acceptable.');
        equipmentChanges.added = [
          { name: 'Kindling sticks', quantity: 2, condition: 'good' as const }
        ];
      }
      break;

    // Starting fire
    case 'start-fire-lighter':
      const tinderForLighter = state.equipment.find(e => e.name.toLowerCase().includes('tinder'));

      // Weather affects fire starting difficulty
      let lighterThreshold = 0.05; // Base 95% success
      if (state.scenario.weather === 'rain') {
        lighterThreshold = 0.35; // 65% success in rain
      } else if (state.scenario.weather === 'storm' || state.scenario.weather === 'snow') {
        lighterThreshold = 0.55; // 45% success in storm/snow
      } else if (state.scenario.weather === 'wind' && state.scenario.windSpeed > 30) {
        lighterThreshold = 0.25; // 75% success in high wind
      }

      // Shelter provides protection when starting fire
      if (state.metrics.shelter > 60) {
        lighterThreshold = lighterThreshold * 0.5; // Shelter reduces difficulty
      }

      metricsChange = {
        energy: -decision.energyCost,
        fireQuality: 75,
        morale: 18,
        cumulativeRisk: -10
      };

      if (roll < lighterThreshold) {
        // Failure
        immediateEffect = 'The lighter sparks but the wind/rain snuffs out every attempt.';
        consequences.push('The conditions are too harsh. The fire will not catch.');
        metricsChange.fireQuality = 0;
        metricsChange.morale = -12;
        metricsChange.cumulativeRisk = 5;
      } else if (roll > 0.95) {
        immediateEffect = 'The lighter sparks perfectly. The tinder catches and flames quickly spread.';
        consequences.push('You have a strong fire burning.');
        metricsChange.fireQuality = 85;
      } else if (roll > lighterThreshold + 0.3) {
        immediateEffect = 'The lighter ignites the tinder. Soon you have a good fire.';
        consequences.push('The fire is burning steadily.');
      } else {
        immediateEffect = 'After many attempts, the lighter finally lights the damp tinder.';
        consequences.push('The fire starts weakly but should build.');
        metricsChange.fireQuality = 60;
        metricsChange.morale = 12;
      }
      if (tinderForLighter) {
        if (tinderForLighter.quantity > 1) {
          equipmentChanges.updated = [{
            ...tinderForLighter,
            quantity: tinderForLighter.quantity - 1
          }];
        } else {
          equipmentChanges.removed = [tinderForLighter.name];
        }
      }
      break;

    case 'start-fire-matches':
      const tinderForMatches = state.equipment.find(e => e.name.toLowerCase().includes('tinder'));
      const matchesItem = state.equipment.find(e => e.name.toLowerCase().includes('matches'));

      // Weather affects matches even more than lighters
      let matchesThreshold = 0.15; // Base 85% success
      if (state.scenario.weather === 'rain') {
        matchesThreshold = 0.50; // 50% success in rain (matches get wet easily)
      } else if (state.scenario.weather === 'storm' || state.scenario.weather === 'snow') {
        matchesThreshold = 0.70; // 30% success in storm/snow
      } else if (state.scenario.weather === 'wind' && state.scenario.windSpeed > 30) {
        matchesThreshold = 0.40; // 60% success in high wind
      }

      // Shelter provides significant protection for matches
      if (state.metrics.shelter > 60) {
        matchesThreshold = matchesThreshold * 0.4; // Shelter greatly helps with matches
      }

      metricsChange = {
        energy: -decision.energyCost,
        fireQuality: 70,
        morale: 15,
        cumulativeRisk: -8
      };

      if (roll < matchesThreshold) {
        // Failure - matches wasted
        immediateEffect = 'The matches are too damp or the wind is too strong. They burn out uselessly.';
        consequences.push('You wasted your matches. The fire did not catch.');
        metricsChange.fireQuality = 0;
        metricsChange.morale = -15;
        metricsChange.cumulativeRisk = 8;
      } else if (roll > 0.85) {
        immediateEffect = 'The match strikes true and the tinder catches immediately.';
        consequences.push('You have a solid fire going.');
        metricsChange.fireQuality = 80;
      } else if (roll > matchesThreshold + 0.2) {
        immediateEffect = 'After a couple tries, the match lights the tinder successfully.';
        consequences.push('The fire is building nicely.');
      } else {
        immediateEffect = 'You use several matches before one finally catches the damp tinder.';
        consequences.push('The fire is weak but alive.');
        metricsChange.fireQuality = 50;
        metricsChange.morale = 8;
      }
      if (tinderForMatches) {
        if (tinderForMatches.quantity > 1) {
          equipmentChanges.updated = [{
            ...tinderForMatches,
            quantity: tinderForMatches.quantity - 1
          }];
        } else {
          equipmentChanges.removed = [tinderForMatches.name];
        }
      }
      if (matchesItem) {
        equipmentChanges.removed = (equipmentChanges.removed || []).concat([matchesItem.name]);
      }
      break;

    case 'start-fire-friction':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -8,
        cumulativeRisk: 8
      };

      // Friction fire is very difficult and heavily affected by conditions
      let frictionSuccessRate = 0.4 + (state.metrics.energy / 100) * 0.2;

      // Weather drastically reduces friction fire success
      if (state.scenario.weather === 'rain' || state.scenario.weather === 'storm' || state.scenario.weather === 'snow') {
        frictionSuccessRate *= 0.3; // 70% penalty for wet conditions
      } else if (state.scenario.weather === 'wind' && state.scenario.windSpeed > 25) {
        frictionSuccessRate *= 0.6; // 40% penalty for wind
      }

      // Shelter helps significantly with friction fire
      if (state.metrics.shelter > 60) {
        frictionSuccessRate *= 1.5; // 50% boost from shelter
        frictionSuccessRate = Math.min(0.75, frictionSuccessRate); // Cap at 75%
      }

      if (roll > (1 - frictionSuccessRate)) {
        immediateEffect = 'After exhausting effort, you create an ember. You nurse it into flames.';
        consequences.push('The friction method worked! You have fire.');
        metricsChange.fireQuality = 65;
        metricsChange.morale = 25;
        metricsChange.cumulativeRisk = -5;
      } else if (roll > 0.3) {
        immediateEffect = 'You create smoke but cannot sustain the ember long enough.';
        consequences.push('Despite your effort, the fire fails to catch.');
        metricsChange.morale = -10;
      } else {
        immediateEffect = 'Your hands blister and the wood never even smokes properly.';
        consequences.push('The attempt was a complete failure.');
        metricsChange.morale = -15;
        metricsChange.injurySeverity = 5;
      }
      break;

    // Maintaining fire
    case 'add-fuel-small':
      const kindlingItem = state.equipment.find(e => e.name.toLowerCase().includes('kindling'));
      metricsChange = {
        energy: -decision.energyCost,
        fireQuality: 15,
        morale: 4
      };
      immediateEffect = 'You add kindling to the fire. The flames grow brighter.';
      consequences.push('The fire will burn steadily for a while.');
      if (kindlingItem) {
        if (kindlingItem.quantity > 1) {
          equipmentChanges.updated = [{
            ...kindlingItem,
            quantity: kindlingItem.quantity - 1
          }];
        } else {
          equipmentChanges.removed = [kindlingItem.name];
          consequences.push('That was your last kindling.');
        }
      }
      break;

    case 'add-fuel-large':
      const fuelLogItem = state.equipment.find(e => e.name.toLowerCase().includes('fuel log'));
      metricsChange = {
        energy: -decision.energyCost,
        fireQuality: 35,
        morale: 8
      };
      immediateEffect = 'You place a large log on the fire. It catches and burns strongly.';
      consequences.push('This fuel should last for several hours.');
      if (fuelLogItem) {
        if (fuelLogItem.quantity > 1) {
          equipmentChanges.updated = [{
            ...fuelLogItem,
            quantity: fuelLogItem.quantity - 1
          }];
        } else {
          equipmentChanges.removed = [fuelLogItem.name];
          consequences.push('That was your last fuel log.');
        }
      }
      break;

    case 'tend-fire':
      metricsChange = {
        energy: -decision.energyCost,
        fireQuality: 8,
        morale: 2
      };
      immediateEffect = 'You rearrange the coals and add air flow to the fire.';
      consequences.push('The fire burns more efficiently.');
      break;

    case 'signal-fire':
      // Principle: "Fire provides signaling" and "Three fires in a triangle is international distress signal"
      metricsChange = {
        energy: -actualEnergyCost,
        fireQuality: -15, // Using fire for signaling reduces it
        morale: 8
      };

      // Signal effectiveness affected by same factors as other signals
      const fireSignalEffectiveness = state.metrics.signalEffectiveness + 20; // Fire is more visible
      const isNightOrDusk = state.scenario.timeOfDay === 'night' || state.scenario.timeOfDay === 'dusk';

      // Night/dusk: fire is visible, use it
      // Day: smoke from green branches is visible
      if (isNightOrDusk) {
        if (roll > 0.65 && fireSignalEffectiveness > 60) {
          immediateEffect = 'You build up the fire to create a bright beacon. A distant light flashes in response!';
          consequences.push('Someone saw your signal! Help is coming!');
          metricsChange.morale = 30;
          metricsChange.cumulativeRisk = -20;
        } else if (roll > 0.45) {
          immediateEffect = 'You stoke the fire high. The flames are visible for miles in the darkness.';
          consequences.push('This fire beacon is a strong signal at night.');
          metricsChange.cumulativeRisk = -8;
        } else {
          immediateEffect = 'You build up the fire, though clouds or terrain may obstruct the view.';
          consequences.push('The signal may still attract attention.');
          metricsChange.cumulativeRisk = -4;
        }
      } else {
        // Daytime: use smoke
        if (roll > 0.7 && fireSignalEffectiveness > 60) {
          immediateEffect = 'You add green branches. Thick white smoke billows up. You hear a helicopter!';
          consequences.push('Your smoke signal was spotted! Rescue is en route!');
          metricsChange.morale = 30;
          metricsChange.cumulativeRisk = -20;
        } else if (roll > 0.5) {
          immediateEffect = 'Green branches create excellent smoke. The signal is visible from far away.';
          consequences.push('The smoke column rises high into the sky.');
          metricsChange.cumulativeRisk = -8;
        } else {
          immediateEffect = 'You add green branches to create smoke, but wind disperses it quickly.';
          consequences.push('The signal is weaker than hoped but may still be seen.');
          metricsChange.cumulativeRisk = -3;
        }
      }

      // This is a signal attempt that can lead to rescue
      break;

    // Water collection and purification
    case 'collect-water':
      // Environment affects water availability and quality
      let waterSuccessThreshold = 0.3; // Base threshold (lower = easier)
      let waterQualityBonus = 0;
      let environmentFeedback = '';

      switch (state.currentEnvironment) {
        case 'mountains':
          // "Clear running water from high elevations is generally safer"
          waterSuccessThreshold = 0.2; // Easier to find
          waterQualityBonus = 0.3; // Better quality
          environmentFeedback = 'Mountain streams are clear and cold.';
          break;
        case 'forest':
          waterSuccessThreshold = 0.3; // Moderate difficulty
          waterQualityBonus = 0.2;
          environmentFeedback = 'Forest streams and pools are available.';
          break;
        case 'coast':
          waterSuccessThreshold = 0.25; // Easy to find BUT...
          waterQualityBonus = -0.2; // Risk of saltwater contamination
          environmentFeedback = 'Coastal water sources must be carefully checked for salt content.';
          break;
        case 'tundra':
          waterSuccessThreshold = 0.4; // Water exists but frozen
          waterQualityBonus = 0.1;
          environmentFeedback = 'You must melt snow or break through ice.';
          metricsChange = { energy: -(decision.energyCost + 5), hydration: -5 }; // Extra energy/hydration cost
          break;
        case 'desert':
          waterSuccessThreshold = 0.7; // Very hard to find
          waterQualityBonus = -0.3; // Often contaminated when found
          environmentFeedback = 'Water is scarce in the desert.';
          metricsChange = { energy: -(decision.energyCost + 3), hydration: -6 }; // Extra cost from heat
          break;
        case 'urban-edge':
          waterSuccessThreshold = 0.35; // Moderate difficulty
          waterQualityBonus = -0.15; // Urban pollution risk
          environmentFeedback = 'Urban runoff may contaminate natural water sources.';
          break;
      }

      if (!metricsChange.energy) {
        metricsChange = {
          energy: -decision.energyCost,
          hydration: -3,
          morale: 5
        };
      }

      const adjustedRoll = roll + waterQualityBonus;

      if (roll < waterSuccessThreshold) {
        // Failure to find water
        immediateEffect = `You search extensively but find no drinkable water. ${environmentFeedback}`;
        consequences.push('Your search was unsuccessful.');
        metricsChange.morale = -10;
      } else if (adjustedRoll > 0.75) {
        immediateEffect = `You find a clear, flowing water source. ${environmentFeedback}`;
        consequences.push('The water looks clean but should still be purified.');
        equipmentChanges.added = [{ name: 'Water bottle (untreated)', quantity: 1, condition: 'good' as const }];
        metricsChange.morale = 12;
      } else if (adjustedRoll > 0.45) {
        immediateEffect = `You locate a water source. ${environmentFeedback}`;
        consequences.push('The water is murky but will help if purified.');
        equipmentChanges.added = [{ name: 'Water bottle (untreated)', quantity: 1, condition: 'good' as const }];
      } else {
        immediateEffect = `After searching, you find only a questionable water source. ${environmentFeedback}`;
        consequences.push('The water quality is poor even for wilderness standards.');
        equipmentChanges.added = [{ name: 'Water bottle (untreated)', quantity: 1, condition: 'worn' as const }];
        metricsChange.morale = 2;
      }

      // Remove empty bottle if present
      const emptyBottle = state.equipment.find(e => e.name.toLowerCase().includes('water bottle (empty)'));
      if (emptyBottle) {
        equipmentChanges.removed = [emptyBottle.name];
      }
      break;

    case 'boil-water':
      const untreatedBottle = state.equipment.find(e => e.name.toLowerCase().includes('water bottle (untreated)'));
      metricsChange = {
        energy: -decision.energyCost,
        fireQuality: -10,
        morale: 8
      };
      immediateEffect = 'You boil the water over the fire. Steam rises as pathogens die.';
      consequences.push('The water is now safe to drink.');
      consequences.push('Boiling consumed some of your fire.');
      if (untreatedBottle) {
        equipmentChanges.removed = [untreatedBottle.name];
        equipmentChanges.added = [{ name: 'Water bottle (clean)', quantity: 1, condition: 'good' as const }];
      }
      break;

    case 'drink-clean-water':
      const cleanBottle = state.equipment.find(e => e.name.toLowerCase().includes('water bottle (clean)') ||
        (e.name.toLowerCase().includes('water bottle') && !e.name.toLowerCase().includes('empty') && !e.name.toLowerCase().includes('untreated')));
      metricsChange = {
        energy: -decision.energyCost,
        hydration: 40,
        morale: 8
      };
      immediateEffect = 'You drink the clean water. It tastes amazing.';
      consequences.push('Your hydration increases significantly.');
      if (cleanBottle) {
        equipmentChanges.removed = [cleanBottle.name];
        equipmentChanges.added = [{ name: 'Water bottle (empty)', quantity: 1, condition: 'good' as const }];
      }
      break;

    case 'drink-untreated-water':
      const untreatedDrinkBottle = state.equipment.find(e => e.name.toLowerCase().includes('water bottle (untreated)'));
      metricsChange = {
        energy: -decision.energyCost,
        hydration: 35,
        morale: 2
      };
      immediateEffect = 'You drink the untreated water. It helps, but you worry about contaminants.';
      consequences.push('Your hydration improves, but there may be consequences...');

      // 40% chance of delayed illness
      if (roll < 0.4) {
        const illnessTurn = state.turnNumber + Math.floor(Math.random() * 3) + 2; // 2-4 turns later
        delayedEffects.push({
          turn: illnessTurn,
          effect: 'Stomach cramps grip you. The untreated water was contaminated.',
          metricsChange: {
            energy: -20,
            morale: -15,
            injurySeverity: 12,
            hydration: -25
          }
        });
      }

      if (untreatedDrinkBottle) {
        equipmentChanges.removed = [untreatedDrinkBottle.name];
        equipmentChanges.added = [{ name: 'Water bottle (empty)', quantity: 1, condition: 'good' as const }];
      }
      break;

    case 'use-whistle':
      metricsChange = {
        energy: -actualEnergyCost,
        morale: roll > 0.6 ? 8 : 3
      };
      if (roll > 0.75 && state.turnNumber < 10) {
        immediateEffect = 'You blow the whistle in three sharp bursts. A faint response echoes back.';
        consequences.push('Someone heard you. Help might be coming.');
        metricsChange.morale = 20;
        metricsChange.cumulativeRisk = -12;
      } else if (roll > 0.4) {
        immediateEffect = 'You signal with the whistle. The sound carries well.';
        consequences.push('If anyone is nearby, they will hear it.');
        metricsChange.cumulativeRisk = -4;
      } else {
        immediateEffect = 'You blow the whistle but hear no response.';
        consequences.push('The area seems empty.');
        metricsChange.morale = -2;
      }
      break;

    case 'use-mirror':
      metricsChange = {
        energy: -actualEnergyCost,
        morale: 5
      };
      if (state.metrics.signalEffectiveness > 60 && roll > 0.65) {
        immediateEffect = 'You flash the signal mirror toward the sky. A helicopter banks toward you.';
        consequences.push('They saw your signal! Rescue is coming!');
        metricsChange.morale = 25;
        metricsChange.cumulativeRisk = -20;
      } else if (roll > 0.5) {
        immediateEffect = 'You reflect sunlight with the mirror across the landscape.';
        consequences.push('The signal is visible from a great distance.');
        metricsChange.cumulativeRisk = -6;
      } else {
        immediateEffect = 'You use the signal mirror but clouds obscure the sun.';
        consequences.push('The timing was not ideal.');
        metricsChange.morale = -1;
      }
      break;

    case 'use-flashlight-scout':
      const flashlightScout = state.equipment.find(e => e.name.toLowerCase().includes('flashlight'));
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -4
      };
      if (roll > 0.7) {
        immediateEffect = 'Using the flashlight, you discover a shelter or resource cache.';
        consequences.push('The darkness concealed something valuable.');
        metricsChange.morale = 12;
        equipmentChanges.added = [{ name: 'Emergency supplies', quantity: 1, condition: 'good' as const }];
      } else if (roll > 0.4) {
        immediateEffect = 'You carefully explore with the flashlight. Nothing dangerous nearby.';
        consequences.push('You understand your immediate surroundings better.');
        metricsChange.morale = 4;
      } else {
        immediateEffect = 'The flashlight reveals difficult terrain in all directions.';
        consequences.push('Your situation is more challenging than you hoped.');
        metricsChange.morale = -5;
      }
      if (flashlightScout && flashlightScout.condition !== 'good' && roll < 0.3) {
        equipmentChanges.updated = [{
          ...flashlightScout,
          condition: 'damaged' as const
        }];
        consequences.push('The flashlight batteries are running low.');
      }
      break;

    case 'use-flashlight-signal':
      metricsChange = {
        energy: -actualEnergyCost,
        morale: 4
      };
      if (roll > 0.7 && (state.scenario.timeOfDay === 'night' || state.scenario.timeOfDay === 'dusk')) {
        immediateEffect = 'You signal SOS with the flashlight. A light blinks back in response!';
        consequences.push('Someone saw your signal.');
        metricsChange.morale = 18;
        metricsChange.cumulativeRisk = -10;
      } else {
        immediateEffect = 'You flash SOS patterns with the flashlight repeatedly.';
        consequences.push('In darkness, the signal could be visible from far away.');
        metricsChange.cumulativeRisk = -3;
      }
      break;

    case 'use-blanket':
      const blanketItem = state.equipment.find(e => e.name.toLowerCase().includes('blanket'));
      metricsChange = {
        energy: -actualEnergyCost,
        bodyTemperature: 0.8,
        morale: 10,
        shelter: 20,
        cumulativeRisk: -6
      };
      immediateEffect = 'You wrap yourself in the emergency blanket. Heat retention improves dramatically.';
      consequences.push('Your body temperature stabilizes.');
      consequences.push('The reflective blanket provides crucial insulation.');
      if (blanketItem && roll < 0.3) {
        equipmentChanges.updated = [{
          ...blanketItem,
          condition: 'worn' as const
        }];
        consequences.push('The blanket is showing wear from use.');
      }
      break;


    case 'use-knife-shelter':
      metricsChange = {
        energy: -decision.energyCost,
        bodyTemperature: 0.4,
        morale: 8,
        shelter: 35,
        cumulativeRisk: -5
      };
      immediateEffect = 'You use the knife to cut branches and improve your shelter structure.';
      consequences.push('Your protection from the elements increases significantly.');
      consequences.push('The knife makes construction much more efficient.');
      break;

    case 'use-rope-descend':
      metricsChange = {
        energy: -decision.energyCost,
        hydration: -8,
        cumulativeRisk: -3
      };
      if (roll > 0.7) {
        immediateEffect = 'Using the rope, you safely descend the steep section.';
        consequences.push('The rope made a dangerous passage manageable.');
        metricsChange.morale = 12;
        metricsChange.cumulativeRisk = -8;
      } else if (roll > 0.4) {
        immediateEffect = 'You descend carefully with the rope as an anchor.';
        consequences.push('Progress is slow but safe.');
        metricsChange.morale = 4;
      } else {
        immediateEffect = 'The rope slips on loose rock. You catch yourself but it was close.';
        consequences.push('That was dangerous. You are shaken.');
        metricsChange.morale = -6;
        metricsChange.injurySeverity = 8;
      }
      break;

    default:
      immediateEffect = 'You take action.';
  }

  // Add feedback for working during hot conditions
  if (additionalHydrationCost < -4) {
    consequences.push('Hard work in the heat causes severe dehydration.');
  } else if (additionalHydrationCost < -2) {
    consequences.push('The heat makes this work more taxing on your hydration.');
  }

  const envEffects = applyEnvironmentalEffects(state.metrics, state.scenario, state.turnNumber);
  const combinedChanges = {
    energy: (metricsChange.energy || 0) + (envEffects.energy || 0),
    bodyTemperature: (metricsChange.bodyTemperature || 0) + (envEffects.bodyTemperature || 0),
    hydration: (metricsChange.hydration || 0) + (envEffects.hydration || 0) + additionalHydrationCost,
    injurySeverity: (metricsChange.injurySeverity || 0) + (envEffects.injurySeverity || 0),
    morale: (metricsChange.morale || 0) + (envEffects.morale || 0),
    shelter: (metricsChange.shelter || 0) + (envEffects.shelter || 0),
    fireQuality: (metricsChange.fireQuality || 0) + (envEffects.fireQuality || 0),
    cumulativeRisk: (metricsChange.cumulativeRisk || 0) + (envEffects.cumulativeRisk || 0)
  };

  const allConsequences = [...consequences, ...guidanceFeedback];

  const outcome: DecisionOutcome = {
    decision,
    consequences: allConsequences,
    metricsChange: combinedChanges,
    immediateEffect,
    delayedEffects
  };

  if (equipmentChanges.added || equipmentChanges.removed || equipmentChanges.updated) {
    outcome.equipmentChanges = equipmentChanges;
  }

  if (environmentChange) {
    outcome.environmentChange = environmentChange;
  }

  const signalingActions = ['use-whistle', 'use-mirror', 'use-flashlight-signal', 'signal', 'signal-water', 'signal-urban', 'signal-fire'];
  if (signalingActions.includes(decision.id)) {
    outcome.wasSignalAttempt = true;
    // Signal fire has higher success rate due to visibility
    const signalFireBonus = decision.id === 'signal-fire' ? 0.1 : 0;
    if (roll > (0.6 - signalFireBonus) || (state.metrics.signalEffectiveness > 60 && roll > (0.4 - signalFireBonus))) {
      outcome.wasSuccessfulSignal = true;
    }
  }

  const navigationSuccessActions = ['retrace-trail', 'search-trail', 'follow-coast', 'find-exit', 'navigate-camp', 'backtrack-vehicle'];
  if (navigationSuccessActions.includes(decision.id) && roll > 0.70) {
    outcome.wasNavigationSuccess = true;
  }

  const evaluation = evaluateDecisionQuality(decision, state, outcome);
  outcome.decisionQuality = evaluation.quality;
  outcome.survivalPrincipleAlignment = evaluation.principle;

  // Add principle-based educational feedback
  if (outcome.decisionQuality === 'excellent' || outcome.decisionQuality === 'good') {
    const educationalNote = getEducationalFeedback(decision.id, outcome.decisionQuality);
    if (educationalNote && Math.random() < 0.6) { // 60% chance for variety
      outcome.consequences.push(`💡 Survival principle: ${educationalNote}`);
    }
  } else if (outcome.decisionQuality === 'poor' || outcome.decisionQuality === 'critical-error') {
    const cautionaryPrinciple = getEducationalFeedback(decision.id, outcome.decisionQuality);
    if (cautionaryPrinciple) {
      outcome.consequences.push(`⚠️ Consider: ${cautionaryPrinciple}`);
    }
  }

  // Generate detailed consequence explanation
  outcome.explanation = generateConsequenceExplanation(
    decision,
    state,
    metricsChange,
    immediateEffect,
    outcome.decisionQuality
  );

  return outcome;
}
