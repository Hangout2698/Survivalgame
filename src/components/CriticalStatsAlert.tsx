import { AlertTriangle } from 'lucide-react';
import { PlayerMetrics } from '../types/game';
import { isCritical, getCriticalWarning } from '../utils/statusThresholds';

interface CriticalStatsAlertProps {
  metrics: PlayerMetrics;
}

interface CriticalStat {
  name: string;
  value: number;
  warning: string;
}

/**
 * Non-dismissible banner showing all critical stats (<30% or custom thresholds)
 * Appears at top of screen with pulsing red border
 */
export function CriticalStatsAlert({ metrics }: CriticalStatsAlertProps) {
  const criticalStats: CriticalStat[] = [];

  // Check each metric using statusThresholds functions
  const metricsToCheck: Array<{ key: keyof PlayerMetrics; displayName: string }> = [
    { key: 'hydration', displayName: 'HYDRATION' },
    { key: 'energy', displayName: 'ENERGY' },
    { key: 'bodyTemperature', displayName: 'BODY TEMPERATURE' },
    { key: 'morale', displayName: 'MORALE' },
    { key: 'shelter', displayName: 'SHELTER' },
    { key: 'injurySeverity', displayName: 'INJURY' }
  ];

  metricsToCheck.forEach(({ key, displayName }) => {
    const value = metrics[key];
    if (typeof value === 'number' && isCritical(key, value)) {
      const warning = getCriticalWarning(key, value);
      if (warning) {
        criticalStats.push({
          name: displayName,
          value,
          warning
        });
      }
    }
  });

  // Don't render if no critical stats
  if (criticalStats.length === 0) return null;

  return (
    <div
      className="fixed top-16 left-0 right-0 z-40 bg-red-900/90 border-t-4 border-red-500 animate-pulse-border"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
        {criticalStats.map((stat, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-red-100">
              <span className="font-bold">
                {stat.name}: {stat.name === 'BODY TEMPERATURE' ? stat.value.toFixed(1) : Math.round(stat.value)}
              </span>
              <span className="ml-2 text-red-200">{stat.warning}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
