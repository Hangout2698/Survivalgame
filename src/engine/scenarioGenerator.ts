import type { Scenario, Environment, Weather, TimeOfDay, Equipment } from '../types/game';
import { enrichScenarioWithImageData } from '../services/imageService';

const environments: Environment[] = ['mountains', 'desert', 'forest', 'coast', 'tundra', 'urban-edge'];

const weatherByEnvironment: Record<Environment, Weather[]> = {
  'mountains': ['clear', 'wind', 'snow', 'storm'],
  'desert': ['clear', 'heat', 'wind', 'storm'],
  'forest': ['clear', 'rain', 'wind', 'storm'],
  'coast': ['clear', 'rain', 'wind', 'storm'],
  'tundra': ['clear', 'wind', 'snow', 'storm'],
  'urban-edge': ['clear', 'rain', 'wind', 'storm']
};

const timesOfDay: TimeOfDay[] = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night'];

const equipmentPool: Equipment[] = [
  { name: 'Water bottle (half full)', quantity: 1, condition: 'good' },
  { name: 'Emergency blanket', quantity: 1, condition: 'good' },
  { name: 'Lighter', quantity: 1, condition: 'worn' },
  { name: 'Signal mirror', quantity: 1, condition: 'good' },
  { name: 'Whistle', quantity: 1, condition: 'good' },
  { name: 'Knife', quantity: 1, condition: 'good' },
  { name: 'Torn tarp', quantity: 1, condition: 'damaged' },
  { name: 'Flashlight', quantity: 1, condition: 'worn' },
  { name: 'Energy bar', quantity: 2, condition: 'good' },
  { name: 'Phone (no signal, 15% battery)', quantity: 1, condition: 'good' },
  { name: 'Rope (10ft)', quantity: 1, condition: 'worn' },
  { name: 'First aid kit (partial)', quantity: 1, condition: 'worn' },
  { name: 'Tinder bundle', quantity: 2, condition: 'good' },
  { name: 'Kindling sticks', quantity: 3, condition: 'good' },
  { name: 'Fuel logs', quantity: 1, condition: 'good' },
  { name: 'Matches', quantity: 1, condition: 'good' }
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

function selectRandomEquipment(): Equipment[] {
  const count = randomInt(2, 4);
  const selected: Equipment[] = [];
  const shuffled = [...equipmentPool].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count && i < shuffled.length; i++) {
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

export function generateScenario(): Scenario {
  const environment = random(environments);
  const weather = random(weatherByEnvironment[environment]);
  const timeOfDay = random(timesOfDay);
  const temperature = getTemperatureRange(environment, weather, timeOfDay);
  const windSpeed = getWindSpeed(environment, weather);
  const equipment = selectRandomEquipment();
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
