import type { Scenario, Environment, Weather, TimeOfDay, Equipment } from '../types/game';
import { enrichScenarioWithImageData } from '../services/imageService';
import { getRecommendedCategories, getTotalStats } from './knowledgeTracker';
import type { PrincipleCategory } from './survivalPrinciplesService';

const environments: Environment[] = ['mountains', 'desert', 'forest', 'coast', 'tundra', 'urban-edge'];

const weatherByEnvironment: Record<Environment, Weather[]> = {
  'mountains': ['clear', 'wind', 'snow', 'storm'],
  'desert': ['clear', 'heat', 'wind', 'storm'],
  'forest': ['clear', 'rain', 'wind', 'storm'],
  'coast': ['clear', 'rain', 'wind', 'storm'],
  'tundra': ['clear', 'wind', 'snow', 'storm'],
  'urban-edge': ['clear', 'rain', 'wind', 'storm']
};

// Map principle categories to environments that test those skills
const categoryToEnvironments: Record<PrincipleCategory, Environment[]> = {
  shelter: ['mountains', 'tundra', 'forest'], // Cold/harsh conditions test shelter skills
  water: ['desert', 'coast', 'tundra'], // Water scarcity or purification challenges
  fire: ['tundra', 'mountains', 'forest'], // Cold environments require fire mastery
  food: ['forest', 'coast', 'desert'], // Foraging and resource identification
  navigation: ['desert', 'forest', 'tundra'], // Difficult terrain for navigation
  signaling: ['coast', 'mountains', 'urban-edge'], // Open areas good for signaling
  firstAid: ['mountains', 'urban-edge', 'forest'], // Injury risks from terrain
  priorities: ['desert', 'tundra', 'mountains'], // Extreme conditions test prioritization
  psychology: ['tundra', 'desert', 'urban-edge'], // Isolation and harsh conditions
  weather: ['mountains', 'coast', 'tundra'] // Variable weather challenges
};

const timesOfDay: TimeOfDay[] = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night'];

const equipmentPool: Equipment[] = [
  // Water & Hydration
  { name: 'Water bottle (half full)', quantity: 1, condition: 'good', volumeLiters: 1.0 },

  // Shelter & Warmth (BULKY)
  { name: 'Emergency blanket', quantity: 1, condition: 'good', volumeLiters: 0.5 }, // Compact foil blanket
  { name: 'Torn tarp', quantity: 1, condition: 'damaged', volumeLiters: 3.5 }, // Bulky when folded

  // Fire Starting
  { name: 'Lighter', quantity: 1, condition: 'worn', volumeLiters: 0.05 }, // Tiny
  { name: 'Matches', quantity: 1, condition: 'good', volumeLiters: 0.1 }, // Small box
  { name: 'Tinder bundle', quantity: 2, condition: 'good', volumeLiters: 0.3 },
  { name: 'Kindling sticks', quantity: 3, condition: 'good', volumeLiters: 1.5 }, // Awkward
  { name: 'Fuel logs', quantity: 1, condition: 'good', volumeLiters: 2.0 }, // Very bulky

  // Signaling
  { name: 'Signal mirror', quantity: 1, condition: 'good', volumeLiters: 0.15 },
  { name: 'Whistle', quantity: 1, condition: 'good', volumeLiters: 0.05 }, // Tiny
  { name: 'Flashlight', quantity: 1, condition: 'worn', volumeLiters: 0.3 },

  // Tools
  { name: 'Knife', quantity: 1, condition: 'good', volumeLiters: 0.2 },
  { name: 'Rope (10ft)', quantity: 1, condition: 'worn', volumeLiters: 1.2 },

  // Medical
  { name: 'First aid kit (partial)', quantity: 1, condition: 'worn', volumeLiters: 1.5 },

  // Food
  { name: 'Energy bar', quantity: 2, condition: 'good', volumeLiters: 0.2 },

  // Electronics
  { name: 'Phone (no signal, 15% battery)', quantity: 1, condition: 'good', volumeLiters: 0.15 }
];

const initialConditions = [
  'You are uninjured but disoriented.',
  'Your ankle is sprained. Movement is painful.',
  'You have a minor head injury. Your thinking feels slow.',
  'You are exhausted from hours of hiking.',
  'You slipped and bruised your ribs. Breathing deeply hurts.',
  'You are cold and beginning to shiver.',
  'You are slightly dehydrated and your head aches.'
];

function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Select environment using weighted probability based on weak knowledge areas
 * Returns an environment that tests the player's weakest skills
 */
function selectAdaptiveEnvironment(): Environment {
  const stats = getTotalStats();

  // If no sessions played yet, use pure random
  if (stats.totalSessions === 0) {
    return random(environments);
  }

  const weakCategories = getRecommendedCategories();

  // If no weak areas (all balanced), use pure random
  if (weakCategories.length === 0) {
    return random(environments);
  }

  // Build weighted environment pool
  const environmentWeights: Map<Environment, number> = new Map();

  // Initialize all environments with base weight of 1
  environments.forEach(env => environmentWeights.set(env, 1));

  // Add weight for environments that test weak categories
  weakCategories.forEach(category => {
    const targetEnvironments = categoryToEnvironments[category];
    targetEnvironments.forEach(env => {
      const current = environmentWeights.get(env) || 1;
      environmentWeights.set(env, current + 2); // +2 weight per weak category
    });
  });

  // Create weighted selection array
  const weightedPool: Environment[] = [];
  environmentWeights.forEach((weight, env) => {
    for (let i = 0; i < weight; i++) {
      weightedPool.push(env);
    }
  });

  return random(weightedPool);
}

function getBackpackCapacity(environment: Environment): number {
  // Backpack size varies by environment context
  switch (environment) {
    case 'urban-edge':
      return randomInt(18, 25); // Small daypack - urban escape scenario
    case 'coast':
    case 'forest':
      return randomInt(28, 38); // Standard daypack - day hike gone wrong
    case 'mountains':
    case 'desert':
      return randomInt(35, 50); // Larger pack - prepared for longer trips
    case 'tundra':
      return randomInt(45, 65); // Expedition pack - serious backcountry
    default:
      return 35;
  }
}

function generateAvailableEquipment(): Equipment[] {
  // Generate a randomized pool of ALL equipment for player to choose from
  // Shuffle the equipment pool to randomize what's available
  const shuffled = [...equipmentPool].sort(() => Math.random() - 0.5);

  // Return 10-14 items from the pool (out of 16 total)
  const itemCount = randomInt(10, 14);
  return shuffled.slice(0, itemCount).map(item => ({ ...item }));
}

// Legacy function - kept for potential tutorial mode or quick start later
// This creates a basic balanced loadout automatically
// @ts-expect-error - Function kept for future tutorial mode
function selectRandomEquipment(): Equipment[] {
  const fireStarters = ['Lighter', 'Matches', 'Tinder bundle'];
  const waterItems = ['Water bottle (half full)'];
  const signalingItems = ['Signal mirror', 'Whistle', 'Flashlight'];

  const selected: Equipment[] = [];

  // Guarantee at least one item from critical categories
  // Fire starter (80% chance for good starter, 20% for just tinder)
  const firePool = equipmentPool.filter(e => fireStarters.includes(e.name));
  if (Math.random() > 0.2) {
    const goodStarters = firePool.filter(e => e.name === 'Lighter' || e.name === 'Matches');
    selected.push({ ...random(goodStarters) });
  } else {
    const tinderOnly = firePool.filter(e => e.name === 'Tinder bundle');
    selected.push({ ...tinderOnly[0] });
  }

  // Water (guaranteed)
  const waterPool = equipmentPool.filter(e => waterItems.includes(e.name));
  selected.push({ ...random(waterPool) });

  // Signaling (guaranteed)
  const signalPool = equipmentPool.filter(e => signalingItems.includes(e.name));
  selected.push({ ...random(signalPool) });

  // Add 1-2 more random items from remaining pool
  const remainingPool = equipmentPool.filter(e =>
    !selected.some(s => s.name === e.name)
  );
  const additionalCount = randomInt(1, 2);
  const shuffled = [...remainingPool].sort(() => Math.random() - 0.5);

  for (let i = 0; i < additionalCount && i < shuffled.length; i++) {
    selected.push({ ...shuffled[i] });
  }

  return selected;
}

function getTemperatureRange(environment: Environment, weather: Weather, timeOfDay: TimeOfDay): number {
  let baseTemp = 20;

  switch (environment) {
    case 'mountains':
      baseTemp = randomInt(0, 15);
      break;
    case 'desert':
      baseTemp = randomInt(25, 45);
      break;
    case 'forest':
      baseTemp = randomInt(10, 25);
      break;
    case 'coast':
      baseTemp = randomInt(12, 22);
      break;
    case 'tundra':
      baseTemp = randomInt(-15, 5);
      break;
    case 'urban-edge':
      baseTemp = randomInt(8, 28);
      break;
  }

  if (weather === 'snow') baseTemp -= randomInt(5, 15);
  if (weather === 'heat') baseTemp += randomInt(10, 20);
  if (weather === 'wind') baseTemp -= randomInt(3, 8);
  if (weather === 'storm') baseTemp -= randomInt(5, 10);

  if (timeOfDay === 'night' || timeOfDay === 'dawn') {
    baseTemp -= randomInt(5, 12);
  } else if (timeOfDay === 'midday') {
    baseTemp += randomInt(3, 8);
  }

  return baseTemp;
}

function getDistanceDescription(): string {
  const options = [
    'Unknown. You lost your bearings.',
    'You think you are 5-10 km from the trailhead.',
    'You estimate 15-20 km to the nearest road.',
    'Uncertain. You have not seen landmarks in hours.',
    'You believe civilization is within 3-5 km.',
    'You are far from help. Perhaps 30+ km.',
    'You passed a ranger station roughly 8 km back.'
  ];
  return random(options);
}

function getWindSpeed(environment: Environment, weather: Weather): number {
  let baseWind = 0;

  if (weather === 'wind') {
    baseWind = randomInt(25, 45);
  } else if (weather === 'storm') {
    baseWind = randomInt(35, 60);
  } else if (weather === 'clear') {
    baseWind = randomInt(0, 10);
  } else {
    baseWind = randomInt(5, 20);
  }

  if (environment === 'coast' || environment === 'tundra' || environment === 'mountains') {
    baseWind += randomInt(0, 10);
  } else if (environment === 'forest') {
    baseWind = Math.max(0, baseWind - randomInt(5, 15));
  }

  return Math.max(0, baseWind);
}

/**
 * Generate a scenario that adapts to player's knowledge gaps
 * Uses knowledge tracker to target weak areas while maintaining variety
 */
export function generateScenario(): Scenario {
  // Use adaptive selection to target weak knowledge areas
  const environment = selectAdaptiveEnvironment();

  // Weight weather selection toward challenging conditions for weak categories
  const weakCategories = getRecommendedCategories();
  let weather = random(weatherByEnvironment[environment]);

  // If fire/shelter are weak, bias toward harsh weather
  if (weakCategories.includes('fire') || weakCategories.includes('shelter')) {
    const harshWeather = weatherByEnvironment[environment].filter(w =>
      w === 'snow' || w === 'storm' || w === 'wind'
    );
    if (harshWeather.length > 0 && Math.random() < 0.6) {
      weather = random(harshWeather);
    }
  }

  // If water is weak, bias toward hot/dry conditions in appropriate environments
  if (weakCategories.includes('water')) {
    if ((environment === 'desert' || environment === 'coast') && Math.random() < 0.6) {
      const dryWeather = weatherByEnvironment[environment].filter(w =>
        w === 'heat' || w === 'clear'
      );
      if (dryWeather.length > 0) {
        weather = random(dryWeather);
      }
    }
  }

  const timeOfDay = random(timesOfDay);
  const temperature = getTemperatureRange(environment, weather, timeOfDay);
  const windSpeed = getWindSpeed(environment, weather);
  const backpackCapacityLiters = getBackpackCapacity(environment);
  const availableEquipment = generateAvailableEquipment();

  // Start with empty equipment - player will choose during loadout phase
  const equipment: Equipment[] = [];

  const initialCondition = random(initialConditions);
  const distanceToSafety = getDistanceDescription();
  const terrainDifficulty = randomInt(3, 8);

  const baseScenario: Scenario = {
    environment,
    weather,
    timeOfDay,
    temperature,
    windSpeed,
    equipment,
    backpackCapacityLiters,
    availableEquipment,
    initialCondition,
    distanceToSafety,
    terrainDifficulty,
    backstoryType: environment,
    wetness: random(['soaked', 'damp', 'dry'] as const)
  };

  // Enrich with image data
  return enrichScenarioWithImageData(baseScenario);
}

export function getScenarioDescription(scenario: Scenario): string {
  const envDescriptions: Record<Environment, string> = {
    'mountains': 'steep mountain terrain',
    'desert': 'arid desert landscape',
    'forest': 'dense forest',
    'coast': 'rocky coastline',
    'tundra': 'frozen tundra',
    'urban-edge': 'abandoned industrial area on the city outskirts'
  };

  const weatherDescriptions: Record<Weather, string> = {
    'clear': 'The sky is clear',
    'rain': 'Rain is falling steadily',
    'wind': 'Strong winds blow across the landscape',
    'snow': 'Snow is falling',
    'heat': 'The heat is oppressive',
    'storm': 'A storm is building'
  };

  const timeDescriptions: Record<TimeOfDay, string> = {
    'dawn': 'First light is breaking',
    'morning': 'It is mid-morning',
    'midday': 'The sun is directly overhead',
    'afternoon': 'It is late afternoon',
    'dusk': 'The light is fading',
    'night': 'It is full dark'
  };

  return `You are alone in ${envDescriptions[scenario.environment]}. ${weatherDescriptions[scenario.weather]}. ${timeDescriptions[scenario.timeOfDay]}. The temperature is ${scenario.temperature}°C. ${scenario.initialCondition} ${scenario.distanceToSafety}`;
}
