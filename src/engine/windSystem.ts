export interface WindEffect {
  windSpeed: number;
  windLevel: number;
  deltaTemp: number;
  effectiveTemp: number;
}

function getWindLevel(windSpeed: number): number {
  if (windSpeed < 5) return 0;
  if (windSpeed <= 15) return 1;
  if (windSpeed <= 30) return 2;
  if (windSpeed <= 50) return 3;
  return 4;
}

function getWindTempEffect(airTemp: number, windLevel: number): number {
  if (windLevel === 0) return 0;

  let baseEffect: number;

  if (airTemp >= 10) {
    baseEffect = -1 * windLevel;
    return Math.max(baseEffect, -4);
  } else if (airTemp >= 0) {
    baseEffect = -2 * windLevel;
    return Math.max(baseEffect, -8);
  } else if (airTemp >= -10) {
    baseEffect = -3 * windLevel;
    return Math.max(baseEffect, -12);
  } else if (airTemp >= -20) {
    baseEffect = -4 * windLevel;
    return Math.max(baseEffect, -16);
  } else {
    baseEffect = -5 * windLevel;
    return Math.max(baseEffect, -20);
  }
}

export function calculateWindEffect(airTemp: number, windSpeed: number): WindEffect {
  const windLevel = getWindLevel(windSpeed);
  const deltaTemp = getWindTempEffect(airTemp, windLevel);
  const effectiveTemp = airTemp + deltaTemp;

  return {
    windSpeed,
    windLevel,
    deltaTemp,
    effectiveTemp,
  };
}

export function getWindDescription(windSpeed: number): string {
  if (windSpeed < 5) return 'Calm';
  if (windSpeed <= 15) return 'Light breeze';
  if (windSpeed <= 30) return 'Moderate wind';
  if (windSpeed <= 50) return 'Strong wind';
  return 'Gale force';
}
