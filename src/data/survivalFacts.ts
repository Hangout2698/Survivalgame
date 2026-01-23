/**
 * Survival Science Facts Database
 * Maps failure causes to educational content for "Hot Cognition" learning
 */

export interface SurvivalFact {
  cause: string;
  title: string;
  facts: string[];
  ruleOfThrees: string;
  prevention: string[];
}

export const SURVIVAL_FACTS: Record<string, SurvivalFact> = {
  hypothermia: {
    cause: 'Death by Hypothermia',
    title: 'The Silent Killer',
    facts: [
      'Hypothermia can set in even in 10°C (50°F) weather if you are wet and exposed to wind.',
      'Your body loses heat 25x faster in water than in air at the same temperature.',
      'The "umbles" (stumbles, mumbles, fumbles, grumbles) are early warning signs of hypothermia.',
      'Core body temperature dropping just 2°C (3.6°F) significantly impairs judgment and motor skills.'
    ],
    ruleOfThrees: 'You can survive 3 hours in harsh cold without shelter',
    prevention: [
      'Build shelter IMMEDIATELY - it\'s your first priority in cold environments',
      'Stay dry - wet clothes steal your body heat',
      'Layer clothing to trap warm air',
      'Keep moving to generate heat, but avoid sweating'
    ]
  },

  hyperthermia: {
    cause: 'Death by Hyperthermia',
    title: 'Heat Exhaustion',
    facts: [
      'Heat stroke occurs when core body temperature exceeds 40°C (104°F).',
      'You can lose up to 1-2 liters of water per hour through sweat in extreme heat.',
      'Dark urine is an early warning sign of dangerous dehydration.',
      'Heat exhaustion impairs decision-making before physical symptoms appear.'
    ],
    ruleOfThrees: 'You can survive 3 hours in extreme heat without shade',
    prevention: [
      'Find or create shade during peak heat (10am-4pm)',
      'Travel during cooler hours (dawn, dusk, night)',
      'Cover your head and neck',
      'Rest frequently and conserve energy'
    ]
  },

  dehydration: {
    cause: 'Death by Dehydration',
    title: 'The Body\'s Breaking Point',
    facts: [
      'You can lose 1-1.5 liters of water per day just through breathing and basic metabolism.',
      'A 10% drop in body water causes severe physical and mental impairment.',
      'At 15% water loss, survival becomes unlikely without immediate intervention.',
      'Thirst is a late indicator - by the time you feel thirsty, you\'re already dehydrated.'
    ],
    ruleOfThrees: 'You can survive 3 days without water',
    prevention: [
      'Ration your sweat, not your water - drink what you have',
      'Avoid alcohol and caffeine - they increase dehydration',
      'Rest during the hottest part of the day',
      'Collect morning dew or rainwater whenever possible'
    ]
  },

  exhaustion: {
    cause: 'Death by Exhaustion',
    title: 'Fatal Energy Depletion',
    facts: [
      'Your brain uses 20% of your body\'s energy despite being only 2% of body weight.',
      'Extreme fatigue causes hallucinations and fatal decision-making errors.',
      'Without food, your body begins breaking down muscle tissue for energy within 24-48 hours.',
      'Cold environments increase caloric needs by up to 50%.'
    ],
    ruleOfThrees: 'You can survive 3 weeks without food',
    prevention: [
      'Conserve energy - don\'t panic, think before acting',
      'Prioritize high-impact, low-energy actions',
      'Rest when possible to preserve strength',
      'Signal for rescue rather than attempting self-rescue when exhausted'
    ]
  },

  despair: {
    cause: 'Death by Giving Up',
    title: 'The Will to Survive',
    facts: [
      'Survival psychology: 80% of survival is mental, 20% is physical skills.',
      'People have survived impossible odds through sheer will and positive mindset.',
      'Panic kills - it causes poor decisions and wastes critical energy.',
      'The "survival mindset" focuses on what you CAN control, not what you can\'t.'
    ],
    ruleOfThrees: 'You can survive 3 seconds without hope',
    prevention: [
      'Set small, achievable goals to maintain motivation',
      'Focus on immediate priorities: shelter, water, warmth',
      'Remember people who need you to return',
      'Celebrate small victories - each hour survived is progress'
    ]
  },

  injury: {
    cause: 'Death by Untreated Injuries',
    title: 'When Wounds Become Fatal',
    facts: [
      'Even minor cuts can become infected within 6-8 hours in wilderness conditions.',
      'Infection can lead to sepsis, which kills in as little as 12-24 hours.',
      'Blood loss of just 2 liters (40% of total volume) is often fatal.',
      'Injuries triple your caloric needs and impair your ability to perform survival tasks.'
    ],
    ruleOfThrees: 'You can survive 3 minutes with severe bleeding',
    prevention: [
      'Treat injuries immediately - don\'t wait',
      'Keep wounds clean and covered',
      'Avoid unnecessary risks when injured',
      'Rest to allow healing - pushing through injuries makes them worse'
    ]
  }
};

export function getFailureFact(metrics: {
  bodyTemperature: number;
  hydration: number;
  energy: number;
  morale: number;
  injurySeverity: number;
}, causeOfDeath?: string): SurvivalFact {
  // If we have an explicit cause from the game engine
  if (causeOfDeath) {
    if (causeOfDeath.toLowerCase().includes('hypotherm') || causeOfDeath.toLowerCase().includes('cold')) {
      return SURVIVAL_FACTS.hypothermia;
    }
    if (causeOfDeath.toLowerCase().includes('heat') || causeOfDeath.toLowerCase().includes('hypertherm')) {
      return SURVIVAL_FACTS.hyperthermia;
    }
    if (causeOfDeath.toLowerCase().includes('dehydrat')) {
      return SURVIVAL_FACTS.dehydration;
    }
    if (causeOfDeath.toLowerCase().includes('exhaust') || causeOfDeath.toLowerCase().includes('energy')) {
      return SURVIVAL_FACTS.exhaustion;
    }
    if (causeOfDeath.toLowerCase().includes('injur') || causeOfDeath.toLowerCase().includes('bleed')) {
      return SURVIVAL_FACTS.injury;
    }
  }

  // Fall back to metrics analysis
  if (metrics.bodyTemperature <= 33) return SURVIVAL_FACTS.hypothermia;
  if (metrics.bodyTemperature >= 40) return SURVIVAL_FACTS.hyperthermia;
  if (metrics.hydration <= 5) return SURVIVAL_FACTS.dehydration;
  if (metrics.energy <= 5) return SURVIVAL_FACTS.exhaustion;
  if (metrics.morale <= 5) return SURVIVAL_FACTS.despair;
  if (metrics.injurySeverity >= 80) return SURVIVAL_FACTS.injury;

  // Default to hypothermia (most common wilderness death)
  return SURVIVAL_FACTS.hypothermia;
}
