import type { Environment, TimeOfDay, Weather, PlayerMetrics } from '../types/game';

/**
 * Computes the base CSS gradient for each environment
 * Returns a linear gradient string optimized for GPU acceleration
 */
export function computeEnvironmentGradient(
  environment: Environment
): string {
  const gradients: Record<Environment, string> = {
    mountains: 'linear-gradient(to bottom, #4A90E2 0%, #87CEEB 50%, #E8F4F8 100%)',
    desert: 'linear-gradient(to bottom, #FFD700 0%, #FFA07A 50%, #EDC9AF 100%)',
    forest: 'linear-gradient(to bottom, #87CEEB 0%, #B0D8F0 50%, #8B7355 100%)',
    coast: 'linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 50%, #1E88E5 100%)',
    tundra: 'linear-gradient(to bottom, #B0C4DE 0%, #D3D3D3 50%, #E8E8E8 100%)',
    'urban-edge': 'linear-gradient(to bottom, #708090 0%, #A0AEC0 50%, #4A5568 100%)',
  };

  return gradients[environment];
}

/**
 * Computes CSS filter strings for time of day lighting effects
 * Returns array of filter strings to be joined
 */
export function computeTimeOfDayFilters(timeOfDay: TimeOfDay): string[] {
  const filters: Record<TimeOfDay, string[]> = {
    dawn: ['brightness(1.1)', 'sepia(0.2)'],
    morning: ['brightness(1.05)'],
    midday: ['brightness(1.1)', 'saturate(0.95)'],
    afternoon: ['hue-rotate(10deg)'],
    dusk: ['brightness(0.8)', 'hue-rotate(320deg)'],
    night: ['brightness(0.4)', 'saturate(0.7)'],
  };

  return filters[timeOfDay];
}

/**
 * Computes weather overlay configuration
 * Returns overlay gradient, opacity, and optional animation class
 */
export function computeWeatherOverlay(
  weather: Weather,
  windSpeed: number
): {
  overlay: string;
  opacity: number;
  animation?: string;
} {
  switch (weather) {
    case 'clear':
      return { overlay: 'transparent', opacity: 0 };

    case 'rain':
      return {
        overlay: 'repeating-linear-gradient(45deg, rgba(100, 150, 200, 0.1) 0px, transparent 2px, transparent 4px, rgba(100, 150, 200, 0.1) 6px)',
        opacity: 0.6,
        animation: 'rain-fall',
      };

    case 'wind':
      return {
        overlay: 'radial-gradient(ellipse at center, rgba(200, 180, 150, 0.05) 0%, transparent 70%)',
        opacity: Math.min(windSpeed / 50, 0.5), // Scale with wind speed
        animation: 'wind-blow',
      };

    case 'snow':
      return {
        overlay: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 1%), radial-gradient(circle at 80% 60%, rgba(255, 255, 255, 0.08) 0%, transparent 1%)',
        opacity: 0.7,
        animation: 'snow-fall',
      };

    case 'heat':
      return {
        overlay: 'linear-gradient(to bottom, rgba(255, 200, 100, 0.15) 0%, rgba(255, 220, 150, 0.1) 100%)',
        opacity: 0.5,
        animation: 'heat-shimmer',
      };

    case 'storm':
      return {
        overlay: 'linear-gradient(to bottom, rgba(30, 30, 50, 0.4) 0%, rgba(50, 50, 70, 0.3) 100%)',
        opacity: 0.7,
        animation: 'storm-pulse',
      };

    default:
      return { overlay: 'transparent', opacity: 0 };
  }
}

/**
 * Computes hazard CSS filters based on player metrics
 * Returns array of filter strings that compound when multiple conditions are met
 */
export function computeHazardFilters(
  metrics: PlayerMetrics,
  temperature: number
): string[] {
  const filters: string[] = [];

  // Hypothermia/frost effect
  if (temperature < 35) {
    const intensity = Math.min((35 - temperature) / 10, 0.5); // Max 0.5 intensity
    filters.push(`hue-rotate(200deg)`);
    filters.push(`saturate(${1 + intensity * 0.3})`);
  }

  // Fatigue/exhaustion effect
  if (metrics.energy < 25) {
    const intensity = (25 - metrics.energy) / 25;
    filters.push(`brightness(${1 - intensity * 0.2})`);
    if (intensity > 0.5) {
      filters.push(`blur(${intensity * 0.5}px)`);
    }
  }

  // Dehydration effect
  if (metrics.hydration < 20) {
    const intensity = (20 - metrics.hydration) / 20;
    filters.push(`saturate(${1 - intensity * 0.4})`);
    filters.push(`contrast(${1 + intensity * 0.2})`);
  }

  // Low morale/psychological effect
  if (metrics.morale < 20) {
    const intensity = (20 - metrics.morale) / 20;
    filters.push(`grayscale(${intensity * 0.3})`);
  }

  return filters;
}

/**
 * Computes shelter visibility and shape based on shelter quality and environment
 * Returns opacity (0-0.6) and SVG shape identifier
 */
export function computeShelterVisibility(
  shelter: number,
  environment: Environment
): {
  opacity: number;
  shape: string;
  position: string;
} {
  const opacity = shelter > 20 ? (shelter / 100) * 0.6 : 0;

  const shapeMap: Record<Environment, string> = {
    mountains: 'lean-to',
    desert: 'rock-shelter',
    forest: 'debris-hut',
    coast: 'driftwood-shelter',
    tundra: 'snow-cave',
    'urban-edge': 'tarp-shelter',
  };

  const positionMap: Record<Environment, string> = {
    mountains: 'bottom-right',
    desert: 'bottom-left',
    forest: 'bottom-right',
    coast: 'bottom-left',
    tundra: 'bottom-center',
    'urban-edge': 'bottom-right',
  };

  return {
    opacity,
    shape: shapeMap[environment],
    position: positionMap[environment],
  };
}

/**
 * Computes progression effects (noise texture, vignette) based on turn number
 * Returns intensity values for visual degradation over time
 */
export function computeProgressionEffects(turnNumber: number): {
  noiseOpacity: number;
  vignetteIntensity: number;
} {
  if (turnNumber <= 3) {
    return { noiseOpacity: 0, vignetteIntensity: 0 };
  } else if (turnNumber <= 7) {
    return { noiseOpacity: 0.05, vignetteIntensity: 0.1 };
  } else {
    return { noiseOpacity: 0.1, vignetteIntensity: 0.2 };
  }
}

/**
 * Detects if user prefers reduced motion
 * Used to disable animations for accessibility
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detects if device is mobile/low-end
 * Used to reduce particle effects and blur radius
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}
