import type { Scenario, Environment, Weather, TimeOfDay, PlayerMetrics, Decision } from '../types/game';

interface Backstory {
  text: string;
  injuries: string[];
  wetness: 'soaked' | 'damp' | 'dry';
  stress: string;
}

interface WeatherDescription {
  current: string;
  wind: string;
  temp: string;
  change: string;
}

interface TerrainDescription {
  terrain: string;
  elevation: string;
  exposure: string;
  ground: string;
}

const backstories: Record<Environment, Backstory[]> = {
  mountains: [
    {
      text: 'You were descending from a day hike when you took a wrong turn in deteriorating visibility. The trail vanished an hour ago.',
      injuries: ['Minor scrapes on both hands from catching yourself on rocks'],
      wetness: 'dry',
      stress: 'Heart rate elevated but steady'
    },
    {
      text: 'Your climbing partner fell and had to be evacuated by another group. You were separated during the descent.',
      injuries: ['Strained shoulder from belaying during the incident'],
      wetness: 'dry',
      stress: 'Adrenaline fading into exhaustion'
    },
    {
      text: 'You left the trail to investigate what you thought was a shortcut. The terrain became impassable.',
      injuries: ['Twisted ankle from a misstep on scree'],
      wetness: 'dry',
      stress: 'Frustration giving way to focus'
    },
    {
      text: 'You were caught in unexpectedly severe weather. When visibility dropped, you lost the trail.',
      injuries: ['Bruised knee from a fall on ice'],
      wetness: 'dry',
      stress: 'Cold and focused on finding shelter'
    }
  ],
  coast: [
    {
      text: 'You were kayaking along the coast when conditions worsened faster than expected. The kayak capsized in rough water near the rocks. You made it to shore, but the kayak is gone.',
      injuries: ['Minor scrapes on palms and one knee from scrambling over rocks'],
      wetness: 'soaked',
      stress: 'Breathing hard from the swim and climb. Adrenaline fading into fatigue'
    },
    {
      text: 'You were walking the coastal trail when a section collapsed. The climb back up was impossible.',
      injuries: ['Bruised ribs from the fall'],
      wetness: 'damp',
      stress: 'Sharp pain when breathing deeply'
    },
    {
      text: 'You hiked down to explore tide pools and lost track of time. The route back is now cut off by rising water.',
      injuries: ['Superficial cuts on forearms from barnacles'],
      wetness: 'dry',
      stress: 'Pulse elevated as the situation becomes clear'
    }
  ],
  desert: [
    {
      text: 'Your vehicle broke down on a remote access road. You started walking toward what you thought was the highway.',
      injuries: ['Blistered feet, right heel especially bad'],
      wetness: 'dry',
      stress: 'Mouth dry. Thoughts slightly scattered'
    },
    {
      text: 'You went for a trail run and pushed farther than planned. Navigation app died when the phone overheated.',
      injuries: ['Dehydration headache building behind your eyes'],
      wetness: 'dry',
      stress: 'Breathing shallow. Mild panic creeping in'
    },
    {
      text: 'You were photographing the landscape at dawn and wandered away from the marked trail. When you turned back, nothing looked familiar.',
      injuries: ['Sunburn starting on neck and forearms'],
      wetness: 'dry',
      stress: 'Calm but watchful'
    }
  ],
  forest: [
    {
      text: 'You were tracking a wildlife sighting and lost the trail. The forest has grown dense and disorienting.',
      injuries: ['Scratches across both arms from brush'],
      wetness: 'dry',
      stress: 'Breathing steady but mind racing'
    },
    {
      text: 'You left your hiking group to take photos of a waterfall. When you tried to rejoin them, you took the wrong fork.',
      injuries: ['Minor insect bites on exposed skin, starting to itch'],
      wetness: 'damp',
      stress: 'Low-grade anxiety building'
    },
    {
      text: 'Heavy rain came without warning. You left the trail seeking shelter and became disoriented in the downpour.',
      injuries: ['Slipped and wrenched your lower back'],
      wetness: 'soaked',
      stress: 'Cold and uncomfortable. Focus narrowing'
    },
    {
      text: 'You followed what looked like a game trail but it petered out. Now the forest is thick in all directions.',
      injuries: ['Scraped shin from tripping over hidden roots'],
      wetness: 'dry',
      stress: 'Calm but alert. Mentally mapping the terrain'
    }
  ],
  tundra: [
    {
      text: 'You were part of a research expedition when a sudden whiteout separated you from the group.',
      injuries: ['Frostbite starting on fingertips'],
      wetness: 'dry',
      stress: 'Hyper-alert. Every sound feels amplified'
    },
    {
      text: 'Your snowmobile broke down kilometers from camp. You started walking but landmarks disappeared in the flat terrain.',
      injuries: ['Mild hypothermia symptoms. Shivering in waves'],
      wetness: 'dry',
      stress: 'Thoughts sluggish. Have to concentrate'
    },
    {
      text: 'You ventured out to check equipment at a remote site. Wind picked up and erased your tracks back.',
      injuries: ['Windburned face. Cheeks feel raw'],
      wetness: 'dry',
      stress: 'Breathing controlled. Forcing yourself to stay methodical'
    }
  ],
  'urban-edge': [
    {
      text: 'You were exploring abandoned buildings for photography when part of a floor gave way. The stairs you used to enter have collapsed.',
      injuries: ['Deep cut on left forearm, bleeding slowly'],
      wetness: 'dry',
      stress: 'Adrenaline spike fading. Hands shaking slightly'
    },
    {
      text: 'You cut through an industrial area to avoid traffic. Now you are surrounded by fences, rubble, and locked gates.',
      injuries: ['Scraped knee from climbing a barrier'],
      wetness: 'dry',
      stress: 'Frustrated but alert'
    },
    {
      text: 'You were jogging through an unfamiliar area when your phone died. The route back is unclear and the area feels unsafe.',
      injuries: ['Fatigued. Legs heavy'],
      wetness: 'damp',
      stress: 'Uneasy. Watching for movement'
    }
  ]
};

function isBackstoryValid(backstory: Backstory, temperature: number, weather: Weather): boolean {
  const injury = backstory.injuries[0].toLowerCase();
  const storyText = backstory.text.toLowerCase();

  if (injury.includes('insect') && temperature < 10) {
    return false;
  }

  if (injury.includes('sunburn') && (temperature < 20 || weather === 'rain' || weather === 'snow' || weather === 'storm')) {
    return false;
  }

  if (injury.includes('frostbite') && temperature > 5) {
    return false;
  }

  if (injury.includes('hypothermia') && temperature > 10) {
    return false;
  }

  if (injury.includes('windburn') && weather !== 'wind' && weather !== 'storm' && weather !== 'snow') {
    return false;
  }

  if (backstory.wetness === 'soaked') {
    const isWaterRelated = storyText.includes('kayak') || storyText.includes('capsized') ||
                          storyText.includes('tide') || storyText.includes('rain');

    if (!isWaterRelated && weather !== 'rain' && weather !== 'snow' && weather !== 'storm') {
      return false;
    }
  }

  if (backstory.wetness === 'damp' && weather === 'heat') {
    const isWaterRelated = storyText.includes('kayak') || storyText.includes('tide') ||
                          storyText.includes('rain') || storyText.includes('waterfall');
    if (!isWaterRelated) {
      return false;
    }
  }

  return true;
}

function getBackstory(environment: Environment, temperature: number, weather: Weather): Backstory {
  const options = backstories[environment];
  const validOptions = options.filter(backstory => isBackstoryValid(backstory, temperature, weather));

  if (validOptions.length === 0) {
    return options[0];
  }

  return validOptions[Math.floor(Math.random() * validOptions.length)];
}

function shortenBackstory(text: string, currentWeather: Weather): string {
  const isWeatherGood = currentWeather === 'clear';

  const shortened: Record<string, string> = {
    'You were descending from a day hike when you took a wrong turn in deteriorating visibility. The trail vanished an hour ago.':
      isWeatherGood ? 'You took a wrong turn earlier in poor visibility.' : 'You took a wrong turn descending in poor visibility.',
    'Your climbing partner fell and had to be evacuated by another group. You were separated during the descent.':
      'You were separated from your group during a climbing incident.',
    'You left the trail to investigate what you thought was a shortcut. The terrain became impassable.':
      'You left the trail for a shortcut that became impassable.',
    'You were caught in unexpectedly severe weather. When visibility dropped, you lost the trail.':
      isWeatherGood ? 'Severe weather yesterday caused you to lose the trail.' : 'Severe weather caused you to lose the trail.',
    'You were kayaking along the coast when conditions worsened faster than expected. The kayak capsized in rough water near the rocks. You made it to shore, but the kayak is gone.':
      isWeatherGood ? 'Your kayak capsized earlier in rough water near rocks.' : 'Your kayak capsized in rough water near rocks.',
    'You were walking the coastal trail when a section collapsed. The climb back up was impossible.':
      'The coastal trail collapsed beneath you.',
    'You hiked down to explore tide pools and lost track of time. The route back is now cut off by rising water.':
      'Rising tide cut off your route back from the tide pools.',
    'Your vehicle broke down on a remote access road. You started walking toward what you thought was the highway.':
      'Your vehicle broke down and you walked toward the highway.',
    'You went for a trail run and pushed farther than planned. Navigation app died when the phone overheated.':
      'Your phone died during a trail run farther than planned.',
    'You were photographing the landscape at dawn and wandered away from the marked trail. When you turned back, nothing looked familiar.':
      'You wandered from the trail while photographing.',
    'You were tracking a wildlife sighting and lost the trail. The forest has grown dense and disorienting.':
      'You lost the trail while tracking wildlife.',
    'You left your hiking group to take photos of a waterfall. When you tried to rejoin them, you took the wrong fork.':
      'You took the wrong fork trying to rejoin your hiking group.',
    'Heavy rain came without warning. You left the trail seeking shelter and became disoriented in the downpour.':
      currentWeather === 'rain' ? 'You left the trail seeking shelter in sudden heavy rain.' : 'After sudden heavy rain, you left the trail and became disoriented.',
    'You followed what looked like a game trail but it petered out. Now the forest is thick in all directions.':
      'A game trail led you deep into thick forest.',
    'You were part of a research expedition when a sudden whiteout separated you from the group.':
      currentWeather === 'snow' ? 'A whiteout separated you from your expedition group.' : 'A whiteout earlier separated you from your expedition group.',
    'Your snowmobile broke down kilometers from camp. You started walking but landmarks disappeared in the flat terrain.':
      'Your snowmobile broke down and landmarks disappeared.',
    'You ventured out to check equipment at a remote site. Wind picked up and erased your tracks back.':
      currentWeather === 'wind' ? 'Wind erased your tracks back from a remote equipment site.' : 'Earlier wind erased your tracks back from a remote equipment site.',
    'You were exploring abandoned buildings for photography when part of a floor gave way. The stairs you used to enter have collapsed.':
      'A floor gave way and your exit stairs collapsed.',
    'You cut through an industrial area to avoid traffic. Now you are surrounded by fences, rubble, and locked gates.':
      'You cut through industrial ruins and became trapped by barriers.',
    'You were jogging through an unfamiliar area when your phone died. The route back is unclear and the area feels unsafe.':
      'Your phone died jogging through an unfamiliar area.'
  };

  return shortened[text] || text;
}

function getTimeAndLight(timeOfDay: TimeOfDay): { time: string; light: string } {
  switch (timeOfDay) {
    case 'dawn':
      return {
        time: 'Just after first light',
        light: 'Eight to ten hours of daylight remaining'
      };
    case 'morning':
      return {
        time: 'Mid-morning',
        light: 'Six to eight hours of daylight remaining'
      };
    case 'midday':
      return {
        time: 'Around noon',
        light: 'Five to six hours until dusk'
      };
    case 'afternoon':
      return {
        time: 'Mid-afternoon',
        light: 'Three to four hours of usable light left'
      };
    case 'dusk':
      return {
        time: 'Late afternoon',
        light: 'One hour of usable light remaining'
      };
    case 'night':
      return {
        time: 'Full dark',
        light: 'Hours until dawn'
      };
  }
}

function getWeatherDescription(weather: Weather, environment: Environment, temperature: number, backstoryText?: string): {
  current: string;
  wind: string;
  temp: string;
  change: string;
} {
  const backstoryHadBadWeather = backstoryText && (
    backstoryText.includes('severe weather') ||
    backstoryText.includes('whiteout') ||
    backstoryText.includes('Heavy rain') ||
    backstoryText.includes('storm')
  );

  const descriptions: Record<Weather, WeatherDescription> = {
    clear: {
      current: environment === 'desert' ? 'Clear sky, sun beating down' : 'Clear sky',
      wind: temperature < 10 ? 'Light wind, cold' : 'Minimal wind',
      temp: `${temperature}°C`,
      change: backstoryHadBadWeather
        ? 'Weather has cleared since earlier'
        : (temperature < 5 ? 'Temperature dropping after sunset' : temperature > 30 ? 'Heat fading with evening' : 'Conditions stable')
    },
    rain: {
      current: 'Rain falling steadily',
      wind: 'Wind driving rain at angle',
      temp: `${temperature}°C, feels colder`,
      change: 'No sign of clearing'
    },
    wind: {
      current: 'Overcast, heavy cloud cover',
      wind: 'Strong wind, constant',
      temp: `${temperature}°C, wind chill factor`,
      change: 'Wind sustained'
    },
    snow: {
      current: 'Snow falling, visibility reduced',
      wind: 'Wind driving snow sideways',
      temp: `${temperature}°C`,
      change: 'Intensity uncertain'
    },
    heat: {
      current: 'Sky hazy with heat',
      wind: 'Air still, oppressive',
      temp: `${temperature}°C`,
      change: 'Heat sustained until evening'
    },
    storm: {
      current: 'Storm building, sky unstable',
      wind: 'Wind gusting unpredictably',
      temp: `${temperature}°C, dropping`,
      change: 'Worsening expected'
    }
  };

  return descriptions[weather];
}

function getLocationAndTerrain(environment: Environment): {
  terrain: string;
  elevation: string;
  exposure: string;
  ground: string;
} {
  const descriptions: Record<Environment, TerrainDescription> = {
    mountains: {
      terrain: 'Mountain terrain, rocky slopes',
      elevation: 'Mid to high elevation',
      exposure: 'Exposed from multiple directions',
      ground: 'Loose rock and scree, unstable footing'
    },
    coast: {
      terrain: 'Rocky coastline, tidal pools',
      elevation: 'Approximately 50 meters above water',
      exposure: 'Exposed to wind from sea',
      ground: 'Slick rock, treacherous footing'
    },
    desert: {
      terrain: 'Desert scrubland, sparse vegetation',
      elevation: 'Low to mid elevation, mostly flat',
      exposure: 'Fully exposed, no cover',
      ground: 'Hard pack and loose sand'
    },
    forest: {
      terrain: 'Dense forest, thick canopy',
      elevation: 'Low to mid elevation',
      exposure: 'Sheltered from wind and sun',
      ground: 'Soft earth, roots, deadfall'
    },
    tundra: {
      terrain: 'Frozen tundra, flat expanse',
      elevation: 'Low elevation',
      exposure: 'Completely exposed',
      ground: 'Hard snow over frozen earth'
    },
    'urban-edge': {
      terrain: 'Industrial ruins, rubble and structures',
      elevation: 'Ground level, some elevated areas',
      exposure: 'Partially sheltered',
      ground: 'Concrete, broken glass, metal debris'
    }
  };

  return descriptions[environment];
}

function getEquipmentSummary(scenario: Scenario, backstory: Backstory): {
  clothing: string;
  shelter: string;
  fire: string;
  water: string;
  food: string;
  signaling: string;
} {
  const hasLighter = scenario.equipment.some(e => e.name.toLowerCase().includes('lighter'));
  const hasWater = scenario.equipment.some(e => e.name.toLowerCase().includes('water'));
  const hasBlanket = scenario.equipment.some(e => e.name.toLowerCase().includes('blanket'));
  const hasTarp = scenario.equipment.some(e => e.name.toLowerCase().includes('tarp'));
  const hasFood = scenario.equipment.some(e => e.name.toLowerCase().includes('energy bar') || e.name.toLowerCase().includes('food'));
  const hasWhistle = scenario.equipment.some(e => e.name.toLowerCase().includes('whistle'));
  const hasMirror = scenario.equipment.some(e => e.name.toLowerCase().includes('mirror'));
  const hasFlashlight = scenario.equipment.some(e => e.name.toLowerCase().includes('flashlight'));

  const clothingDescriptions: Record<Environment, string> = {
    mountains: backstory.wetness === 'soaked' ? 'Hiking clothes, soaked' : 'Hiking clothes, not warm enough',
    coast: backstory.wetness === 'soaked' ? 'Wetsuit and spray jacket, wet' : 'Light layers, windbreaker',
    desert: 'Light clothing, hat',
    forest: backstory.wetness === 'soaked' ? 'Outdoor gear, wet' : 'Layered outdoor clothing',
    tundra: 'Insulated layers, adequate for movement',
    'urban-edge': 'Casual clothes'
  };

  return {
    clothing: clothingDescriptions[scenario.environment],
    shelter: hasTarp ? 'Torn tarp, improvised shelter possible' : hasBlanket ? 'Emergency blanket' : 'No shelter materials',
    fire: hasLighter ? `Lighter${backstory.wetness === 'soaked' ? ', untested since submersion' : ', fuel uncertain'}` : 'No fire-starting capability',
    water: hasWater ? 'Water bottle, half full' : 'No water',
    food: hasFood ? 'Energy bars' : 'No food',
    signaling: hasWhistle && hasMirror ? 'Whistle and signal mirror' : hasWhistle ? 'Whistle' : hasMirror ? 'Signal mirror' : hasFlashlight ? 'Flashlight' : 'Limited signaling'
  };
}

function getImmediateHazards(scenario: Scenario, backstory: Backstory): string[] {
  const hazards: string[] = [];

  if (backstory.wetness === 'soaked' || backstory.wetness === 'damp') {
    hazards.push('Heat loss from wet clothing and wind exposure');
  }

  if (scenario.temperature < 5) {
    hazards.push('Hypothermia risk increasing with time');
  }

  if (scenario.temperature > 35) {
    hazards.push('Heat exhaustion without shade and water');
  }

  if (scenario.environment === 'coast') {
    hazards.push('Tide is rising—some areas you crossed may be inaccessible soon');
  }

  if (scenario.weather === 'storm') {
    hazards.push('Storm conditions worsening. Lightning risk if exposed');
  }

  if (scenario.weather === 'snow' && scenario.environment === 'mountains') {
    hazards.push('Visibility dropping. Avalanche terrain above');
  }

  if (scenario.environment === 'mountains' && scenario.timeOfDay === 'dusk') {
    hazards.push('Terrain navigation becomes dangerous in darkness');
  }

  if (scenario.environment === 'desert' && scenario.weather === 'heat') {
    hazards.push('Dehydration accelerating in extreme heat');
  }

  if (backstory.injuries.some(i => i.toLowerCase().includes('cut') || i.toLowerCase().includes('bleeding'))) {
    hazards.push('Bleeding needs attention');
  }

  if (hazards.length === 0) {
    hazards.push('Exposure, fatigue, and disorientation');
  }

  return hazards.slice(0, 3);
}

function getRescueSituation(environment: Environment): {
  known: string;
  unclear: string;
} {
  const rescueScenarios = {
    mountains: {
      known: 'Route logged, expected back this evening',
      unclear: 'Will be noticed missing but trail location unknown'
    },
    coast: {
      known: 'Float plan filed, expected return by evening',
      unclear: 'Exact location unknown, no mobile signal'
    },
    desert: {
      known: 'Vehicle on remote road, will eventually be found',
      unclear: 'Walking direction unknown, missed status uncertain'
    },
    forest: {
      known: 'Hiking group knows you split off',
      unclear: 'May have returned already, alert timing uncertain'
    },
    tundra: {
      known: 'Group will notice when weather clears',
      unclear: 'Timing unknown, search difficult in conditions'
    },
    'urban-edge': {
      known: 'General location known',
      unclear: 'Timeline for concern unclear, area isolated'
    }
  };

  return rescueScenarios[environment];
}

function getStayVsGoAnalysis(environment: Environment): {
  travelDistance: string;
  travelTerrain: string;
} {
  const analyses: Record<Environment, { travelDistance: string; travelTerrain: string }> = {
    mountains: {
      travelDistance: 'Trail approximately one to two kilometers back',
      travelTerrain: 'Rocky terrain, unstable footing, 200 meter descent'
    },
    coast: {
      travelDistance: 'Coastal trail three to four kilometers north',
      travelTerrain: 'Boulder scrambling, tidal zones, sections tide-dependent'
    },
    desert: {
      travelDistance: 'Highway five to eight kilometers west, vehicle behind',
      travelTerrain: 'Open desert, minimal shade, navigation difficult'
    },
    forest: {
      travelDistance: 'Main trail within two to three kilometers',
      travelTerrain: 'Dense forest, heavy brush, direction uncertain'
    },
    tundra: {
      travelDistance: 'Camp four to six kilometers south-southwest',
      travelTerrain: 'Flat tundra, complete whiteout, no landmarks'
    },
    'urban-edge': {
      travelDistance: 'Active streets two to three kilometers away',
      travelTerrain: 'Fences, debris, barriers may force detours'
    }
  };

  return analyses[environment];
}

function getInformationGaps(): string {
  const gaps = [
    "Weather trajectory uncertain.",
    "Energy reserves unknown.",
    "Search status unknown.",
    "Terrain ahead unknown.",
    "Rate of condition change after dark unknown."
  ];

  return gaps[Math.floor(Math.random() * gaps.length)];
}

export function generateBriefing(scenario: Scenario): string {
  const backstory = getBackstory(scenario.environment, scenario.temperature, scenario.weather);
  const timeAndLight = getTimeAndLight(scenario.timeOfDay);
  const weather = getWeatherDescription(scenario.weather, scenario.environment, scenario.temperature, backstory.text);
  const location = getLocationAndTerrain(scenario.environment);
  // Equipment summary not currently included in briefing, but function called for future use
  getEquipmentSummary(scenario, backstory);
  const hazards = getImmediateHazards(scenario, backstory);
  const rescue = getRescueSituation(scenario.environment);
  const stayVsGo = getStayVsGoAnalysis(scenario.environment);
  const gaps = getInformationGaps();

  const sections = [
    '🔹 SURVIVAL SITUATION BRIEF',
    '',
    'WHAT HAPPENED',
    '',
    shortenBackstory(backstory.text, scenario.weather),
    '',
    'TIME & LIGHT',
    '',
    timeAndLight.time,
    timeAndLight.light,
    '',
    'WEATHER',
    '',
    weather.current,
    weather.wind,
    weather.temp,
    weather.change,
    '',
    'LOCATION',
    '',
    location.terrain,
    location.elevation,
    location.exposure,
    location.ground,
    '',
    'YOUR CONDITION',
    '',
    backstory.injuries[0],
    backstory.wetness === 'soaked' ? 'Clothing soaked' : backstory.wetness === 'damp' ? 'Clothing damp' : 'Clothing dry',
    backstory.stress,
    '',
    'IMMEDIATE RISKS',
    '',
    ...hazards,
    '',
    'RESCUE & DISTANCE',
    '',
    rescue.known,
    rescue.unclear,
    '',
    stayVsGo.travelDistance,
    stayVsGo.travelTerrain,
    '',
    'UNKNOWN FACTORS',
    '',
    gaps,
    '',
    'You need to decide what to do next.'
  ];

  return sections.join('\n');
}

export function generateConciseBrief(
  scenario: Scenario,
  metrics: PlayerMetrics,
  currentTimeOfDay: TimeOfDay,
  lastOutcome?: {
    decision: Decision;
    immediateEffect: string;
    decisionQuality?: string;
    survivalPrincipleAlignment?: string;
  }
): string {
  const timeAndLight = getTimeAndLight(currentTimeOfDay);
  const weather = getWeatherDescription(scenario.weather, scenario.environment, scenario.temperature);
  const location = getLocationAndTerrain(scenario.environment);
  const rescue = getRescueSituation(scenario.environment);
  const stayVsGo = getStayVsGoAnalysis(scenario.environment);

  const sections = ['🔹 SITUATION BRIEF', ''];

  if (lastOutcome) {
    sections.push('LAST ACTION');
    sections.push('');
    sections.push(`You decided to: ${lastOutcome.decision.text.toLowerCase()}`);

    if (lastOutcome.survivalPrincipleAlignment) {
      const quality = lastOutcome.decisionQuality === 'excellent' || lastOutcome.decisionQuality === 'good'
        ? 'Sound decision'
        : lastOutcome.decisionQuality === 'poor'
        ? 'Questionable decision'
        : 'Critical error';

      sections.push(`${quality}: ${lastOutcome.survivalPrincipleAlignment}`);
    }
    sections.push('');
  }

  sections.push('CURRENT SITUATION');
  sections.push('');
  sections.push(`${timeAndLight.time}. ${timeAndLight.light}.`);
  sections.push(`${weather.current}. ${weather.temp}.`);
  sections.push(`${location.terrain}.`);

  if (metrics.energy < 30 || metrics.hydration < 30 || metrics.bodyTemperature < 35 || metrics.bodyTemperature > 38 || metrics.injurySeverity > 50) {
    sections.push('');
    const criticalConditions = [];
    if (metrics.energy < 30) criticalConditions.push('exhaustion is critical');
    if (metrics.hydration < 30) criticalConditions.push('dehydration is severe');
    if (metrics.bodyTemperature < 35) criticalConditions.push('hypothermia risk is high');
    if (metrics.bodyTemperature > 38) criticalConditions.push('hyperthermia risk is high');
    if (metrics.injurySeverity > 50) criticalConditions.push('injuries are severe');

    if (criticalConditions.length > 0) {
      sections.push(`Critical: ${criticalConditions.join(', ')}.`);
    }
  }

  sections.push('');
  sections.push('ESCAPE OPTIONS');
  sections.push('');

  sections.push('Travel: ' + stayVsGo.travelDistance + '. ' + stayVsGo.travelTerrain + '.');

  sections.push('');
  sections.push('Wait for rescue: ' + rescue.known + '. However, ' + rescue.unclear.toLowerCase() + '.');

  return sections.join('\n');
}
