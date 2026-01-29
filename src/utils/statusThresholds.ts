/**
 * Status Thresholds & Color Coding System
 * Defines consistent thresholds and colors for all survival metrics
 */

export type StatusLevel = 'critical' | 'warning' | 'caution' | 'safe';

export interface StatusConfig {
  level: StatusLevel;
  color: string;
  textColor: string;
  bgColor: string;
  label: string;
  borderColor: string;
}

// Consistent color palette
export const STATUS_COLORS: Record<StatusLevel, StatusConfig> = {
  critical: {
    level: 'critical',
    color: '#FF4444',
    textColor: '#FF6666',
    bgColor: 'bg-red-900/40',
    borderColor: 'border-red-600',
    label: 'CRITICAL'
  },
  warning: {
    level: 'warning',
    color: '#FF9800',
    textColor: '#FFB74D',
    bgColor: 'bg-orange-900/40',
    borderColor: 'border-orange-600',
    label: 'WARNING'
  },
  caution: {
    level: 'caution',
    color: '#FFC107',
    textColor: '#FFD54F',
    bgColor: 'bg-yellow-900/40',
    borderColor: 'border-yellow-600',
    label: 'CAUTION'
  },
  safe: {
    level: 'safe',
    color: '#4CAF50',
    textColor: '#66BB6A',
    bgColor: 'bg-green-900/40',
    borderColor: 'border-green-600',
    label: 'SAFE'
  }
};

// Hydration thresholds
export function getHydrationStatus(value: number): StatusConfig {
  if (value < 20) return STATUS_COLORS.critical;
  if (value < 40) return STATUS_COLORS.warning;
  if (value < 60) return STATUS_COLORS.caution;
  return STATUS_COLORS.safe;
}

export function getHydrationLabel(value: number): string {
  if (value < 20) return 'CRITICAL DEHYDRATION';
  if (value < 40) return 'DEHYDRATED';
  if (value < 60) return 'MILD DEHYDRATION';
  return 'HYDRATED';
}

// Energy thresholds
export function getEnergyStatus(value: number): StatusConfig {
  if (value < 20) return STATUS_COLORS.critical;
  if (value < 40) return STATUS_COLORS.warning;
  if (value < 60) return STATUS_COLORS.caution;
  return STATUS_COLORS.safe;
}

export function getEnergyLabel(value: number): string {
  if (value < 20) return 'EXHAUSTED';
  if (value < 40) return 'LOW ENERGY';
  if (value < 60) return 'TIRED';
  return 'ENERGIZED';
}

// Body temperature thresholds (°C)
export function getTemperatureStatus(value: number): StatusConfig {
  if (value < 32.5 || value > 42) return STATUS_COLORS.critical;
  if (value < 35 || value > 40) return STATUS_COLORS.warning;
  if (value < 36.5 || value > 38) return STATUS_COLORS.caution;
  return STATUS_COLORS.safe;
}

export function getTemperatureLabel(value: number): string {
  if (value < 32.5) return 'SEVERE HYPOTHERMIA';
  if (value < 35) return 'HYPOTHERMIA';
  if (value < 36.5) return 'GETTING COLD';
  if (value > 42) return 'HEAT STROKE';
  if (value > 40) return 'HYPERTHERMIA';
  if (value > 38) return 'GETTING HOT';
  return 'NORMAL';
}

// Morale thresholds
export function getMoraleStatus(value: number): StatusConfig {
  if (value < 20) return STATUS_COLORS.critical;
  if (value < 40) return STATUS_COLORS.warning;
  if (value < 60) return STATUS_COLORS.caution;
  return STATUS_COLORS.safe;
}

export function getMoraleLabel(value: number): string {
  if (value < 20) return 'BROKEN';
  if (value < 40) return 'SHAKEN';
  if (value < 60) return 'STEADY';
  if (value < 85) return 'FOCUSED';
  return 'DETERMINED';
}

// Shelter thresholds
export function getShelterStatus(value: number): StatusConfig {
  if (value < 20) return STATUS_COLORS.critical;
  if (value < 50) return STATUS_COLORS.warning;
  if (value < 80) return STATUS_COLORS.caution;
  return STATUS_COLORS.safe;
}

export function getShelterLabel(value: number): string {
  if (value < 20) return 'NO PROTECTION';
  if (value < 50) return 'MINIMAL SHELTER';
  if (value < 80) return 'BASIC SHELTER';
  return 'EXCELLENT PROTECTION';
}

// Injury severity (inverse - higher is worse)
export function getInjuryStatus(value: number): StatusConfig {
  if (value > 70) return STATUS_COLORS.critical;
  if (value > 50) return STATUS_COLORS.warning;
  if (value > 30) return STATUS_COLORS.caution;
  return STATUS_COLORS.safe;
}

export function getInjuryLabel(value: number): string {
  if (value > 70) return 'CRITICAL INJURY';
  if (value > 50) return 'SEVERE INJURY';
  if (value > 30) return 'MODERATE INJURY';
  if (value > 10) return 'MINOR INJURY';
  return 'NO INJURY';
}

// Check if value is in critical range (for immediate threats)
export function isCritical(metricName: string, value: number): boolean {
  switch (metricName) {
    case 'hydration':
    case 'energy':
    case 'morale':
    case 'shelter':
      return value < 30;
    case 'bodyTemperature':
      return value < 33 || value > 41;
    case 'injurySeverity':
      return value > 60;
    default:
      return false;
  }
}

// Get warning message for critical stat
export function getCriticalWarning(metricName: string, value: number): string | null {
  if (!isCritical(metricName, value)) return null;

  const warnings: Record<string, string> = {
    hydration: `Hydration is CRITICAL (${Math.round(value)}/100) — Find water immediately or risk organ failure`,
    energy: `Energy is CRITICAL (${Math.round(value)}/100) — Extreme exertion will cause collapse`,
    bodyTemperature: value < 33
      ? `Body Temperature CRITICAL (${value.toFixed(1)}°C) — Hypothermia imminent, seek warmth NOW`
      : `Body Temperature CRITICAL (${value.toFixed(1)}°C) — Heat stroke risk, find shade immediately`,
    morale: `Morale is CRITICAL (${Math.round(value)}/100) — Risk of giving up, focus on small wins`,
    shelter: `Shelter CRITICAL (${Math.round(value)}%) — Exposed to elements, build protection now`,
    injurySeverity: `Injury CRITICAL (${Math.round(value)}/100) — Requires immediate medical treatment`
  };

  return warnings[metricName] || null;
}
