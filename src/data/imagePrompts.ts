import type { Environment, Weather, TimeOfDay } from '../types/game';

/**
 * Image Prompt Templates for Scenario Hero Images
 *
 * These prompts are designed for AI image generation (Claude/DALL-E)
 * Each prompt creates atmospheric wilderness imagery for survival scenarios
 */

interface ImagePromptTemplate {
  heroImage: string;
  style: string;
  mood: string;
}

type ScenarioKey = `${Environment}-${Weather}-${TimeOfDay}`;

/**
 * Generate a contextual image prompt for a scenario
 */
export function getScenarioImagePrompt(
  environment: Environment,
  weather: Weather,
  timeOfDay: TimeOfDay
): string {
  const key: ScenarioKey = `${environment}-${weather}-${timeOfDay}`;

  const template = scenarioPrompts[key] || getDefaultPrompt(environment, weather, timeOfDay);

  return `${template.heroImage}. ${template.style}. ${template.mood}. First-person perspective, cinematic wilderness photography, high detail, realistic lighting, survival game aesthetic.`;
}

/**
 * Get a default prompt when specific combination isn't defined
 */
function getDefaultPrompt(
  environment: Environment,
  weather: Weather,
  timeOfDay: TimeOfDay
): ImagePromptTemplate {
  const envBase = environmentBase[environment];
  const weatherMod = weatherModifiers[weather];
  const timeMod = timeModifiers[timeOfDay];

  return {
    heroImage: `${envBase} with ${weatherMod}`,
    style: 'Photorealistic wilderness scene',
    mood: timeMod
  };
}

/**
 * Base environment descriptions
 */
const environmentBase: Record<Environment, string> = {
  mountains: 'Rugged mountain terrain with rocky cliffs and steep slopes',
  desert: 'Vast arid desert landscape with sand dunes and scattered rocks',
  forest: 'Dense temperate forest with tall trees and undergrowth',
  coast: 'Rocky coastline with waves crashing against cliffs',
  tundra: 'Frozen tundra with snow-covered ground and sparse vegetation',
  'urban-edge': 'Abandoned industrial area on city outskirts with overgrown structures'
};

/**
 * Weather modifiers
 */
const weatherModifiers: Record<Weather, string> = {
  clear: 'clear skies',
  rain: 'steady rainfall and dark clouds',
  wind: 'strong winds bending vegetation',
  snow: 'falling snow and poor visibility',
  heat: 'heat shimmer and harsh sunlight',
  storm: 'ominous storm clouds and dramatic lighting'
};

/**
 * Time of day mood descriptors
 */
const timeModifiers: Record<TimeOfDay, string> = {
  dawn: 'Early morning light with golden hour glow, dramatic shadows',
  morning: 'Bright morning light, crisp and clear atmosphere',
  midday: 'Harsh overhead sunlight, strong contrasts',
  afternoon: 'Warm afternoon light, long shadows beginning',
  dusk: 'Fading twilight with orange and purple sky, diminishing light',
  night: 'Dark night with limited moonlight, mysterious atmosphere'
};

/**
 * Specific high-priority scenario prompts
 * These are hand-crafted for the most common/dramatic scenarios
 */
const scenarioPrompts: Partial<Record<ScenarioKey, ImagePromptTemplate>> = {
  // Mountains - Critical scenarios
  'mountains-storm-dusk': {
    heroImage: 'Mountain ridge at dusk with approaching storm, dark clouds rolling over peaks, last rays of sunlight',
    style: 'Dramatic wilderness photography, high contrast',
    mood: 'Ominous and threatening, isolated feeling'
  },
  'mountains-snow-night': {
    heroImage: 'Snow-covered mountain slope at night, moonlight on fresh snow, limited visibility',
    style: 'Cold blue tones, minimal lighting',
    mood: 'Dangerous isolation, extreme cold atmosphere'
  },
  'mountains-clear-dawn': {
    heroImage: 'Mountain vista at dawn, golden light on peaks, valley below in shadow',
    style: 'Majestic landscape photography, warm tones',
    mood: 'Hopeful but challenging, vast wilderness'
  },

  // Desert - Critical scenarios
  'desert-heat-midday': {
    heroImage: 'Desert landscape at noon, heat waves rising from sand, harsh sunlight',
    style: 'Overexposed highlights, intense contrast',
    mood: 'Oppressive heat, desolate and unforgiving'
  },
  'desert-storm-afternoon': {
    heroImage: 'Desert with approaching sandstorm on horizon, dark wall of dust',
    style: 'Ominous atmospheric photography',
    mood: 'Impending danger, need for immediate shelter'
  },
  'desert-clear-night': {
    heroImage: 'Desert under starlit sky, sand dunes in moonlight, clear cold night',
    style: 'Long exposure night photography, star trails',
    mood: 'Beautiful but deadly cold, vast emptiness'
  },

  // Forest - Critical scenarios
  'forest-storm-dusk': {
    heroImage: 'Dense forest with storm approaching through trees, wind-bent branches',
    style: 'Moody forest photography, dark greens and grays',
    mood: 'Claustrophobic tension, nature\'s power'
  },
  'forest-rain-night': {
    heroImage: 'Dark forest at night with rain falling, limited visibility through trees',
    style: 'Low-light photography, wet surfaces reflecting minimal light',
    mood: 'Disorienting darkness, need for shelter'
  },
  'forest-clear-morning': {
    heroImage: 'Forest clearing in morning light, sun rays through canopy, mist rising',
    style: 'Atmospheric forest photography, soft lighting',
    mood: 'Peaceful but watchful, natural beauty with underlying danger'
  },

  // Coast - Critical scenarios
  'coast-storm-afternoon': {
    heroImage: 'Rocky coastline with massive waves crashing, storm clouds overhead',
    style: 'Dynamic ocean photography, motion blur on waves',
    mood: 'Raw power of nature, immediate danger'
  },
  'coast-wind-dusk': {
    heroImage: 'Coastal cliffs at dusk, strong wind visible in spray and vegetation',
    style: 'Dramatic seascape, wind-swept atmosphere',
    mood: 'Relentless elements, exposure to wind'
  },

  // Tundra - Critical scenarios
  'tundra-snow-afternoon': {
    heroImage: 'Arctic tundra during snowfall, whiteout conditions, flat horizon barely visible',
    style: 'Minimal color palette, white and gray tones',
    mood: 'Extreme isolation, hypothermia risk'
  },
  'tundra-wind-night': {
    heroImage: 'Frozen tundra at night with wind-driven snow, aurora borealis faint in sky',
    style: 'Arctic photography, blue and green atmospheric light',
    mood: 'Deadly beauty, unsurvivable exposure'
  },
  'tundra-clear-dawn': {
    heroImage: 'Tundra landscape at first light, snow-covered ground stretching to horizon',
    style: 'Minimalist arctic photography, pastel dawn colors',
    mood: 'Serene but unforgiving, endless cold wilderness'
  },

  // Urban-edge - Critical scenarios
  'urban-edge-storm-dusk': {
    heroImage: 'Abandoned industrial buildings at dusk with storm approaching, broken windows and overgrown concrete',
    style: 'Urban decay photography, post-industrial aesthetic',
    mood: 'Desolate civilization, eerie abandonment'
  },
  'urban-edge-rain-night': {
    heroImage: 'Dark abandoned warehouse district at night in rain, water reflecting minimal ambient light',
    style: 'Noir urban photography, wet surfaces',
    mood: 'Urban survival, man-made dangers'
  }
};

/**
 * Decision outcome illustration prompts
 * Micro-illustrations for specific decision types
 */
export const decisionIllustrationPrompts: Record<string, string> = {
  // Shelter decisions
  shelter: 'Building a debris shelter in wilderness, first-person hands arranging branches',
  'improve-shelter': 'Reinforcing a wilderness shelter with branches and leaves',
  'build-fire': 'Hands using a lighter to start kindling, close-up survival fire building',

  // Signaling
  signal: 'Signal mirror reflecting sunlight, wilderness background blurred',
  'signal-fire': 'Large smoke signal rising from hilltop, aerial perspective',
  whistle: 'Emergency whistle being blown, sound waves visualization',

  // Navigation
  navigate: 'Broken compass on wilderness terrain map, first-person view',
  'stay-put': 'Survival shelter entrance, waiting inside perspective',
  'follow-terrain': 'Mountain ridge or valley corridor, path forward visible',

  // Resource gathering
  water: 'Collecting water from stream into bottle, close-up hands',
  food: 'Wild edible plants or berries being gathered',
  firewood: 'Gathering dry wood and kindling in forest',

  // Medical
  'treat-injury': 'First aid kit open, bandaging a wound, close-up',
  rest: 'Person resting in shelter, conservation of energy',

  // Risk
  panic: 'Blurred motion of rapid movement through difficult terrain',
  'high-risk': 'Dangerous terrain - cliff edge, steep descent, objective danger visible'
};
