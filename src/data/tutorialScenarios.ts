/**
 * Tutorial Scenarios - Special teaching moments that appear based on game state
 * These scenarios teach critical survival principles through high-stakes choices
 */

export interface TutorialScenario {
  id: string;
  title: string;
  concept: string;
  setup: string;
  educationalHook: string;
  triggerCondition: (gameState: any) => boolean;
  choices: {
    id: string;
    text: string;
    description: string;
    outcome: {
      immediate: string;
      metricsChange: {
        energy?: number;
        hydration?: number;
        bodyTemperature?: number;
        morale?: number;
        shelter?: number;
        injurySeverity?: number;
        cumulativeRisk?: number;
        signalEffectiveness?: number;
      };
      educationalFeedback: string;
      quality: 'excellent' | 'good' | 'poor' | 'critical-error';
      principle: string;
    };
  }[];
  timeLimit?: number; // Minutes before consequence
}

export const TUTORIAL_SCENARIOS: Record<string, TutorialScenario> = {
  stayOrGo: {
    id: 'stayOrGo',
    title: 'The "Stay or Go" Trap',
    concept: 'S.T.O.P. Principle (Sit, Think, Observe, Plan)',
    setup: `You were hiking when a sudden fog rolled in. You are completely disoriented, and the sun is setting in 60 minutes. Panic begins to creep in.

You think you know the general direction of the trail, but visibility is less than 20 feet. Moving now could get you further lost in the dark.`,
    educationalHook: 'Search and Rescue (SAR) usually finds people within a 5-mile radius of their last known point. Moving while panicked exponentially decreases your survival rate. The S.T.O.P. principle has saved countless lives.',
    triggerCondition: (gameState) => {
      // Trigger on turn 2-4, when player might be disoriented
      return gameState.turnNumber >= 2 &&
             gameState.turnNumber <= 4 &&
             gameState.currentTimeOfDay === 'dusk' &&
             gameState.metrics.morale < 70;
    },
    timeLimit: 60,
    choices: [
      {
        id: 'pushThrough',
        text: 'Push Through the Fog',
        description: 'Try to find the trail before total darkness. High risk but could work.',
        outcome: {
          immediate: 'You stumble through the fog, branches scraping your face. After 30 minutes of panicked movement, you realize you\'re even more lost. Your energy is depleted and you\'ve traveled away from your last known position.',
          metricsChange: {
            energy: -35,
            morale: -20,
            cumulativeRisk: 40,
            injurySeverity: 15
          },
          educationalFeedback: '⚠️ MISTAKE: "Panic is the enemy of survival. SAR teams search from your LAST KNOWN POSITION. By moving in fog, you\'ve created a massive search area and exhausted yourself."',
          quality: 'critical-error',
          principle: 'Never move when disoriented - you make yourself HARDER to find, not easier.'
        }
      },
      {
        id: 'stopPrinciple',
        text: 'S.T.O.P. - Stay Put',
        description: 'Sit, Think, Observe, Plan. Begin immediate night preparation where you are.',
        outcome: {
          immediate: 'You sit down, take three deep breaths, and assess your situation calmly. You mark your position with visible items, then begin building a simple shelter using nearby materials. As darkness falls, you\'re protected and at your last known location.',
          metricsChange: {
            energy: -10,
            morale: 15,
            shelter: 30,
            cumulativeRisk: -10
          },
          educationalFeedback: '✅ EXCELLENT: "The S.T.O.P. principle is the foundation of survival psychology. You stayed calm, conserved energy, and made yourself findable. Most lost hikers are found within 24 hours of their last known position."',
          quality: 'excellent',
          principle: 'S.T.O.P.: Sit, Think, Observe, Plan - The first rule when you\'re lost.'
        }
      }
    ]
  },

  wetIsDeath: {
    id: 'wetIsDeath',
    title: 'The "Wet is Death" Dilemma',
    concept: 'Thermoregulation - Moisture is the Enemy of Body Heat',
    setup: `You fell into a shallow creek while crossing. Your clothes are completely soaked, and the wind is picking up. You can feel your body temperature dropping rapidly.

You see a dry cave 200 yards away that would block the wind. You also notice a patch of dry wood and an open area nearby where you could address your wet clothes.`,
    educationalHook: 'Water conducts heat away from the body 25 times faster than air. Wet cotton loses 100% of its insulation value. The #1 killer in wilderness survival is hypothermia, and it can occur even in 50°F (10°C) weather when combined with wind and moisture.',
    triggerCondition: (gameState) => {
      return gameState.metrics.bodyTemperature < 36 &&
             gameState.turnNumber >= 3 &&
             gameState.scenario.temperature < 15;
    },
    choices: [
      {
        id: 'runToCave',
        text: 'Run to the Cave',
        description: 'Sprint to the cave to get out of the wind immediately.',
        outcome: {
          immediate: 'You run to the cave and collapse inside, out of the wind. But your soaked clothes continue to suck heat from your core. The cave blocks wind but doesn\'t solve the wet clothing problem. You begin to shiver violently.',
          metricsChange: {
            energy: -15,
            bodyTemperature: -1.5, // Still losing heat
            morale: -5
          },
          educationalFeedback: '⚠️ POOR CHOICE: "The cave stopped convective heat loss (wind) but not conductive heat loss (wet fabric). Your wet clothes are still draining heat 25x faster than dry air. You need to address the moisture."',
          quality: 'poor',
          principle: 'Wind protection alone doesn\'t save you from wet clothes - the water keeps conducting heat away.'
        }
      },
      {
        id: 'strippingMethod',
        text: 'The Stripping Method',
        description: 'Stop, remove wet layers, wring them out, and do high-intensity movement to generate heat.',
        outcome: {
          immediate: 'You strip off wet outer layers, wring them out thoroughly, and perform 2 minutes of intense star jumps and arm swings. Your core temperature rises from the exertion. You put the wrung-out clothes back on - they\'re still damp but no longer soaked. The thin air layer between fabric and skin acts as insulation.',
          metricsChange: {
            energy: -20,
            bodyTemperature: 1.0, // Heat generated + reduced conduction
            morale: 10
          },
          educationalFeedback: '✅ GOOD: "You addressed the primary threat: conductive heat loss from soaked clothing. Wringing removes 60-70% of water. The intense movement generated metabolic heat. Air gaps in damp (not soaked) clothing still provide some insulation."',
          quality: 'excellent',
          principle: 'Wet is death. Wring out clothes and generate heat through movement before seeking shelter.'
        }
      }
    ]
  },

  signalingParadox: {
    id: 'signalingParadox',
    title: 'The Signaling Paradox',
    concept: 'Being Seen vs. Moving Fast - Geometry and Contrast',
    setup: `You hear the distinct sound of a helicopter in the distance. Your heart races - this could be your rescue! But you\'re under a dense forest canopy.

The helicopter sounds like it\'s moving away from you. You could try to run toward the sound, or you could use what you have to make yourself visible from above.`,
    educationalHook: 'Helicopter pilots rarely see a moving person in a forest - even if you\'re directly below them. What they DO see is: 1) Geometry that doesn\'t occur in nature (straight lines, crosses, triangles), 2) Contrast (bright colors, smoke, reflections), 3) Movement of LARGE objects (waving branches, not people).',
    triggerCondition: (gameState) => {
      return gameState.turnNumber >= 6 &&
             gameState.metrics.signalEffectiveness > 40 &&
             gameState.currentTimeOfDay === 'midday';
    },
    choices: [
      {
        id: 'chaseHelicopter',
        text: 'Chase the Helicopter',
        description: 'Run toward the sound to get under the flight path before it\'s gone.',
        outcome: {
          immediate: 'You sprint through the forest, branches whipping your face. The helicopter sound grows fainter. You burst into a small clearing, gasping, and scan the sky - but the helicopter is already a distant speck. Your frantic waving goes completely unseen. You\'ve wasted precious energy.',
          metricsChange: {
            energy: -40,
            morale: -25,
            injurySeverity: 10,
            cumulativeRisk: 15
          },
          educationalFeedback: '⚠️ CRITICAL ERROR: "Pilots scan for visual anomalies, not runners. At helicopter speed (100+ mph) and altitude, you appeared as a dot for maybe 2 seconds. Dense canopy blocked most visibility. Energy wasted, rescue missed."',
          quality: 'critical-error',
          principle: 'Never chase aircraft - they move too fast and you\'re too small. Make yourself VISIBLE instead.'
        }
      },
      {
        id: 'buildSignalCross',
        text: 'Build a Signal Cross',
        description: 'Stay put and create a large visual signal using contrast and geometry.',
        outcome: {
          immediate: 'You quickly move to a small clearing and arrange bright gear into a large X-pattern on the ground (the international distress signal). You add green branches to a small fire, creating thick white smoke that rises above the canopy. Within 15 minutes, the helicopter circles back - they saw the smoke and the geometric pattern!',
          metricsChange: {
            energy: -15,
            morale: 30,
            signalEffectiveness: 80
          },
          educationalFeedback: '✅ EXCELLENT: "You created THREE pilot-visible indicators: 1) Geometry (X = distress), 2) Contrast (bright against forest floor), 3) Smoke (visible above trees). Pilots are trained to spot these anomalies. The helicopter crew immediately recognized the intentional signal."',
          quality: 'excellent',
          principle: 'Pilots see PATTERNS and CONTRAST, not people. Create geometry that screams "human intervention".'
        }
      }
    ]
  },

  hydrationMyth: {
    id: 'hydrationMyth',
    title: 'The Hydration Myth',
    concept: 'Resource Management - Store Water in Your Belly, Not Your Bottle',
    setup: `You have 500ml of water left in your bottle. You need to trek 10 miles in high heat to reach a potential water source. Your throat is parched, and you can feel dehydration setting in.

The sun is brutal. You know you need water to function, but you\'re terrified of running out.`,
    educationalHook: 'People have been found dead of dehydration with half-full canteens. Why? They rationed water thinking they were being "smart." The truth: Your body IS your water reservoir. A dehydrated brain makes fatal decisions. Drink to thirst, then find more water.',
    triggerCondition: (gameState) => {
      return gameState.metrics.hydration < 50 &&
             gameState.turnNumber >= 5 &&
             gameState.scenario.temperature > 25;
    },
    choices: [
      {
        id: 'sipAndSave',
        text: 'Sip and Save',
        description: 'Take tiny sips every hour to make the water last the whole day.',
        outcome: {
          immediate: 'You take careful 50ml sips spread over hours. By midday, you\'re dizzy and making poor decisions - you miss a clear trail marker. Your cognitive function is impaired. You still have 200ml left when you collapse from heat exhaustion, unable to think clearly enough to navigate.',
          metricsChange: {
            hydration: 10, // Minimal benefit
            energy: -25,
            morale: -15,
            cumulativeRisk: 35,
            injurySeverity: 20
          },
          educationalFeedback: '⚠️ FATAL MISTAKE: "Rationing water is a myth. Your brain, blood, and cells NEED hydration to function. By under-hydrating, you impaired decision-making, reduced physical performance, and ironically INCREASED water loss through inefficient movement."',
          quality: 'critical-error',
          principle: 'Your canteen is NOT your water reservoir - your BODY is. Drink to thirst.'
        }
      },
      {
        id: 'drinkToThirst',
        text: 'Drink to Thirst',
        description: 'Drink 300ml now to fully hydrate, then move efficiently toward water.',
        outcome: {
          immediate: 'You drink deeply, rehydrating your brain and organs. Your thinking clears. You navigate efficiently, rest during peak heat, and spot a stream you would have missed while dehydrated. Your body performed optimally when it mattered most.',
          metricsChange: {
            hydration: 35,
            energy: 10, // Better performance
            morale: 15,
            cumulativeRisk: -10
          },
          educationalFeedback: '✅ EXCELLENT: "You prioritized brain function and physical performance over false security. A hydrated person makes better decisions, moves more efficiently, and has better thermoregulation. Water is only valuable INSIDE your body."',
          quality: 'excellent',
          principle: 'Ration sweat, not water. Hydrate fully, then find shade and rest during peak heat.'
        }
      }
    ]
  },

  energyVsShelter: {
    id: 'energyVsShelter',
    title: 'The "Energy vs. Shelter" Race',
    concept: 'Rule of 3s - 3 Hours Without Shelter in Extreme Conditions',
    setup: `It is 4:00 PM. Dark clouds gather - a blizzard is imminent, arriving in about 2 hours. You are exhausted (Energy < 30%) and starving.

You can see a good spot for a lean-to shelter 50 yards away. You also know there might be edible plants or small game nearby if you spend time foraging. You can\'t do both before the storm hits.`,
    educationalHook: 'The Rule of 3s: You can survive 3 minutes without air, 3 hours without shelter (in extreme weather), 3 days without water, 3 weeks without food. Food is LAST because your body has reserves. A blizzard with no shelter kills in hours. Prioritize correctly or die.',
    triggerCondition: (gameState) => {
      return gameState.metrics.energy < 35 &&
             gameState.metrics.shelter < 20 &&
             gameState.currentTimeOfDay === 'afternoon' &&
             gameState.scenario.temperature < 5;
    },
    choices: [
      {
        id: 'forageHunt',
        text: 'Forage/Hunt',
        description: 'Spend the last hour of light looking for food to restore energy.',
        outcome: {
          immediate: 'You spend 90 minutes searching for food. You find some berries (+10 energy) just as the blizzard hits. With no shelter, the wind tears through you. You try to build something in the dark but fail. Hypothermia sets in rapidly. You have food in your stomach as you freeze.',
          metricsChange: {
            energy: -20, // Net loss (10 gained - 30 spent searching)
            bodyTemperature: -3.5,
            morale: -30,
            cumulativeRisk: 60,
            injurySeverity: 35
          },
          educationalFeedback: '⚠️ FATAL ERROR: "You violated the Rule of 3s. Food was prioritized over shelter. Result: You had 10 extra energy points while dying of exposure. The blizzard killed you in 3 hours - you could have survived 3 WEEKS without that food."',
          quality: 'critical-error',
          principle: 'Rule of 3s: Shelter beats food EVERY TIME in extreme weather. You can\'t eat if you\'re dead.'
        }
      },
      {
        id: 'buildShelterNow',
        text: 'Build Shelter Immediately',
        description: 'Use remaining energy to construct emergency shelter before storm.',
        outcome: {
          immediate: 'You push through exhaustion to build a basic lean-to with insulation. The blizzard hits just as you finish. You\'re hungry and tired, but protected. The shelter blocks wind and traps body heat. You survive the night, weak but alive - able to forage tomorrow.',
          metricsChange: {
            energy: -25, // Hard work
            shelter: 60,
            bodyTemperature: 0.5, // Slight gain from work + protected
            morale: 20,
            cumulativeRisk: -15
          },
          educationalFeedback: '✅ EXCELLENT: "You applied the Rule of 3s correctly. Shelter > Water > Food. Yes, you\'re hungry - but you\'ll survive weeks without food. You would NOT have survived 3 hours in that blizzard. Tomorrow you can forage, but only because you\'re ALIVE."',
          quality: 'excellent',
          principle: 'Rule of 3s hierarchy: Air (minutes) > Shelter (hours) > Water (days) > Food (weeks).'
        }
      }
    ]
  }
};

// Helper function to get available tutorial scenarios based on game state
export function getTriggeredTutorialScenario(gameState: any): TutorialScenario | null {
  for (const scenario of Object.values(TUTORIAL_SCENARIOS)) {
    if (scenario.triggerCondition(gameState)) {
      return scenario;
    }
  }
  return null;
}
