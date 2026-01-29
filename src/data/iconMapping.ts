import {
  Flame,
  Droplets,
  Battery,
  Heart,
  Home,
  Thermometer,
  Radio,
  AlertTriangle,
  TrendingUp,
  Mountain,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  CloudLightning,
  Sunrise,
  Sun as Midday,
  Sunset,
  Moon,
  Compass,
  Tent,
  Axe,
  Search,
  Phone,
  Flashlight,
  Wallet,
  Sandwich,
  Clock,
  Zap,
  Shield,
  Target,
  Navigation,
  MapPin,
  Activity,
  Bed,
  type LucideIcon
} from 'lucide-react';
import type { Environment, Weather, TimeOfDay } from '../types/game';

/**
 * Icon Mapping System
 *
 * Maps game entities to Lucide React icons for consistent visual language
 */

// Metrics icons
export const metricIcons: Record<string, LucideIcon> = {
  energy: Battery,
  hydration: Droplets,
  bodyTemperature: Thermometer,
  morale: Heart,
  shelter: Home,
  fireQuality: Flame,
  signalEffectiveness: Radio,
  injurySeverity: AlertTriangle,
  cumulativeRisk: Target,
  survivalProbability: TrendingUp
};

// Environment icons
export const environmentIcons: Record<Environment, LucideIcon> = {
  mountains: Mountain,
  desert: Sun,
  forest: Axe, // Tree icon alternative
  coast: Droplets, // Wave-like representation
  tundra: CloudSnow,
  'urban-edge': Home
};

// Weather icons
export const weatherIcons: Record<Weather, LucideIcon> = {
  clear: Sun,
  rain: CloudRain,
  wind: Wind,
  snow: CloudSnow,
  heat: Sun,
  storm: CloudLightning
};

// Time of day icons
export const timeOfDayIcons: Record<TimeOfDay, LucideIcon> = {
  dawn: Sunrise,
  morning: Sun,
  midday: Midday,
  afternoon: Sunset,
  dusk: Sunset,
  night: Moon
};

// Equipment icons - maps equipment names to icons
export const equipmentIcons: Record<string, LucideIcon> = {
  'Water bottle (half full)': Droplets,
  'Emergency blanket': Shield,
  'Lighter': Flame,
  'Signal mirror': Radio,
  'Whistle': Radio,
  'Knife': Axe,
  'Torn tarp': Tent,
  'Flashlight': Flashlight,
  'Energy bar': Sandwich,
  'Phone (no signal, 15% battery)': Phone,
  'Rope (10ft)': Activity,
  'First aid kit (partial)': Heart,
  'Tinder bundle': Flame,
  'Kindling sticks': Flame,
  'Fuel logs': Flame,
  'Matches': Flame
};

// Decision type icons - maps decision IDs to icons
export const decisionTypeIcons: Record<string, LucideIcon> = {
  // Shelter
  'build-shelter': Tent,
  'improve-shelter': Home,
  'emergency-shelter': Shield,
  'shelter-upgrade': Home,

  // Fire
  'build-fire': Flame,
  'maintain-fire': Flame,
  'signal-fire': Radio,
  'start-fire': Flame,

  // Signaling
  'signal-mirror': Radio,
  'signal-whistle': Radio,
  'signal-smoke': Radio,
  'signal-ground': Target,

  // Navigation
  'navigate': Compass,
  'stay-put': MapPin,
  'explore': Search,
  'follow-terrain': Navigation,
  'retrace': MapPin,

  // Resources
  'find-water': Droplets,
  'collect-water': Droplets,
  'search-food': Search,
  'gather-resources': Sandwich,
  'collect-firewood': Flame,

  // Rest and recovery
  'rest': Bed,
  'conserve-energy': Battery,
  'wait': Clock,

  // Medical
  'treat-injury': Heart,
  'first-aid': Heart,
  'bandage': Shield,

  // High risk
  'panic-move': AlertTriangle,
  'descend': Mountain,
  'risky-shortcut': AlertTriangle,
  'push-through': Zap
};

/**
 * Get icon for a metric
 */
export function getMetricIcon(metricName: string): LucideIcon {
  return metricIcons[metricName] || Activity;
}

/**
 * Get icon for environment
 */
export function getEnvironmentIcon(environment: Environment): LucideIcon {
  return environmentIcons[environment];
}

/**
 * Get icon for weather
 */
export function getWeatherIcon(weather: Weather): LucideIcon {
  return weatherIcons[weather];
}

/**
 * Get icon for time of day
 */
export function getTimeOfDayIcon(timeOfDay: TimeOfDay): LucideIcon {
  return timeOfDayIcons[timeOfDay];
}

/**
 * Get icon for equipment by name (partial match supported)
 */
export function getEquipmentIcon(equipmentName: string): LucideIcon {
  // Exact match first
  if (equipmentIcons[equipmentName]) {
    return equipmentIcons[equipmentName];
  }

  // Partial match
  const key = Object.keys(equipmentIcons).find(k =>
    equipmentName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(equipmentName.toLowerCase())
  );

  return key ? equipmentIcons[key] : Wallet;
}

/**
 * Get icon for a decision
 * Tries exact match first, then keyword matching
 */
export function getDecisionIcon(decisionId: string, decisionText?: string): LucideIcon {
  // Exact match
  if (decisionTypeIcons[decisionId]) {
    return decisionTypeIcons[decisionId];
  }

  // Keyword matching on ID or text
  const searchText = (decisionId + ' ' + (decisionText || '')).toLowerCase();

  if (searchText.includes('shelter')) return Tent;
  if (searchText.includes('fire')) return Flame;
  if (searchText.includes('signal')) return Radio;
  if (searchText.includes('water')) return Droplets;
  if (searchText.includes('navigate') || searchText.includes('move')) return Compass;
  if (searchText.includes('rest') || searchText.includes('wait')) return Bed;
  if (searchText.includes('treat') || searchText.includes('aid')) return Heart;
  if (searchText.includes('food') || searchText.includes('eat')) return Sandwich;
  if (searchText.includes('search') || searchText.includes('explore')) return Search;
  if (searchText.includes('panic') || searchText.includes('risk')) return AlertTriangle;

  // Default
  return Activity;
}

/**
 * Get color class for metric level
 * Returns Tailwind color classes based on metric value
 */
export function getMetricColorClass(metricName: string, value: number): string {
  // Special handling for bodyTemperature (32-42°C range)
  if (metricName === 'bodyTemperature') {
    if (value < 35 || value > 39) return 'text-red-500';
    if (value < 36 || value > 38) return 'text-yellow-500';
    return 'text-green-500';
  }

  // Standard 0-100 metrics
  if (value >= 70) return 'text-green-500';
  if (value >= 40) return 'text-yellow-500';
  if (value >= 20) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get risk color based on risk level
 */
export function getRiskColorClass(riskLevel: number): string {
  if (riskLevel >= 8) return 'text-red-600';
  if (riskLevel >= 5) return 'text-orange-500';
  if (riskLevel >= 3) return 'text-yellow-500';
  return 'text-green-500';
}
