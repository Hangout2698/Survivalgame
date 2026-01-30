import React, { useMemo } from 'react';
import { GameState } from '../../types/game';
import {
  getHydrationStatus,
  getHydrationLabel,
  getEnergyStatus,
  getEnergyLabel,
  getTemperatureStatus,
  getTemperatureLabel,
  getMoraleStatus,
  getMoraleLabel,
  getShelterStatus,
  getShelterLabel,
  getInjuryStatus,
  getInjuryLabel,
  isCritical,
  getCriticalWarning,
} from '../../utils/statusThresholds';

interface StatsTabProps {
  gameState: GameState;
  compact?: boolean;
}

interface MetricDisplayProps {
  label: string;
  value: number;
  max: number;
  status: { label: string; color: string };
  unit?: string;
  showThresholds?: boolean;
}

const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  max,
  status,
  unit = '',
  showThresholds = true,
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const displayValue = unit ? `${value.toFixed(1)}${unit}` : Math.round(value);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-slate-100">
            {displayValue}
            {!unit && <span className="text-slate-400">/{max}</span>}
          </span>
          <span className={`text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2.5 bg-slate-900/50 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${status.color.replace('text-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />

        {/* Threshold Markers */}
        {showThresholds && (
          <>
            <div
              className="absolute inset-y-0 w-0.5 bg-slate-600/50"
              style={{ left: '20%' }}
              title="Critical threshold"
            />
            <div
              className="absolute inset-y-0 w-0.5 bg-slate-600/50"
              style={{ left: '50%' }}
              title="Warning threshold"
            />
            <div
              className="absolute inset-y-0 w-0.5 bg-slate-600/50"
              style={{ left: '80%' }}
              title="Good threshold"
            />
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Stats Tab - Displays all 9 player metrics with status indicators
 * Shows critical warnings and survival probability
 */
const StatsTab: React.FC<StatsTabProps> = ({ gameState, compact }) => {
  const { metrics, turnNumber, currentTimeOfDay } = gameState;

  // Calculate day and hour
  const day = Math.floor(turnNumber / 3) + 1;
  const hour = (() => {
    const hourMap: Record<string, string> = {
      dawn: '06:00',
      morning: '09:00',
      midday: '12:00',
      afternoon: '15:00',
      dusk: '18:00',
      night: '00:00',
    };
    return hourMap[currentTimeOfDay] || '??:??';
  })();

  // Get status for each metric
  const hydrationStatus = { ...getHydrationStatus(metrics.hydration), label: getHydrationLabel(metrics.hydration) };
  const energyStatus = { ...getEnergyStatus(metrics.energy), label: getEnergyLabel(metrics.energy) };
  const bodyTempStatus = { ...getTemperatureStatus(metrics.bodyTemperature), label: getTemperatureLabel(metrics.bodyTemperature) };
  const moraleStatus = { ...getMoraleStatus(metrics.morale), label: getMoraleLabel(metrics.morale) };
  const shelterStatus = { ...getShelterStatus(metrics.shelter), label: getShelterLabel(metrics.shelter) };
  const injuryStatus = { ...getInjuryStatus(metrics.injurySeverity), label: getInjuryLabel(metrics.injurySeverity) };

  // Signal Effectiveness status (higher is better)
  const signalStatus = useMemo(() => {
    const value = metrics.signalEffectiveness;
    if (value > 70) return { label: 'EXCELLENT', color: 'text-green-400' };
    if (value > 50) return { label: 'Good', color: 'text-cyan-400' };
    if (value > 30) return { label: 'Fair', color: 'text-yellow-400' };
    return { label: 'Poor', color: 'text-orange-400' };
  }, [metrics.signalEffectiveness]);

  // Cumulative Risk status (higher is worse)
  const riskStatus = useMemo(() => {
    const value = metrics.cumulativeRisk;
    if (value > 70) return { label: 'CRITICAL', color: 'text-red-400' };
    if (value > 50) return { label: 'High', color: 'text-orange-400' };
    if (value > 30) return { label: 'Moderate', color: 'text-yellow-400' };
    return { label: 'Low', color: 'text-green-400' };
  }, [metrics.cumulativeRisk]);

  // Survival Probability status (higher is better)
  const survivalStatus = useMemo(() => {
    const value = metrics.survivalProbability;
    if (value > 70) return { label: 'EXCELLENT', color: 'text-green-400' };
    if (value > 50) return { label: 'Good', color: 'text-cyan-400' };
    if (value > 30) return { label: 'Fair', color: 'text-yellow-400' };
    if (value > 15) return { label: 'Poor', color: 'text-orange-400' };
    return { label: 'CRITICAL', color: 'text-red-400' };
  }, [metrics.survivalProbability]);

  // Detect critical threats
  const criticalThreats = useMemo(() => {
    const threats: string[] = [];

    const hydrationWarning = isCritical('hydration', metrics.hydration) ? getCriticalWarning('hydration', metrics.hydration) : null;
    if (hydrationWarning) threats.push(hydrationWarning);

    const energyWarning = isCritical('energy', metrics.energy) ? getCriticalWarning('energy', metrics.energy) : null;
    if (energyWarning) threats.push(energyWarning);

    const tempWarning = isCritical('bodyTemperature', metrics.bodyTemperature) ? getCriticalWarning('bodyTemperature', metrics.bodyTemperature) : null;
    if (tempWarning) threats.push(tempWarning);

    const injuryWarning = isCritical('injurySeverity', metrics.injurySeverity) ? getCriticalWarning('injurySeverity', metrics.injurySeverity) : null;
    if (injuryWarning) threats.push(injuryWarning);

    // Add survival probability warning if very low
    if (metrics.survivalProbability < 15) {
      threats.push(`Survival Probability CRITICAL (${Math.round(metrics.survivalProbability)}%) — Multiple threats present`);
    }

    return threats;
  }, [metrics]);

  return (
    <div className={`p-4 space-y-4 ${compact ? 'text-sm' : ''}`}>
      {/* Time Display */}
      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-400">Turn</div>
            <div className="text-lg font-bold text-cyan-400">#{turnNumber}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Day</div>
            <div className="text-lg font-bold text-cyan-400">{day}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Time</div>
            <div className="text-lg font-bold text-cyan-400">{hour}</div>
          </div>
        </div>
      </div>

      {/* Critical Threats Section */}
      {criticalThreats.length > 0 && (
        <div className="bg-red-950/30 border border-red-700 rounded-lg p-3 animate-pulse">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-red-400 mb-1">
                CRITICAL THREATS
              </div>
              <ul className="space-y-1">
                {criticalThreats.map((threat, idx) => (
                  <li key={idx} className="text-xs text-red-300">
                    • {threat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Primary Metrics */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Vital Metrics
        </div>

        <MetricDisplay
          label="Hydration"
          value={metrics.hydration}
          max={100}
          status={hydrationStatus}
        />

        <MetricDisplay
          label="Energy"
          value={metrics.energy}
          max={100}
          status={energyStatus}
        />

        <MetricDisplay
          label="Body Temperature"
          value={metrics.bodyTemperature}
          max={42}
          status={bodyTempStatus}
          unit="°C"
          showThresholds={false}
        />

        <MetricDisplay
          label="Injury Severity"
          value={metrics.injurySeverity}
          max={100}
          status={injuryStatus}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="space-y-3 pt-3 border-t border-slate-700/50">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Survival Factors
        </div>

        <MetricDisplay
          label="Morale"
          value={metrics.morale}
          max={100}
          status={moraleStatus}
        />

        <MetricDisplay
          label="Shelter Quality"
          value={metrics.shelter}
          max={100}
          status={shelterStatus}
        />

        <MetricDisplay
          label="Signal Effectiveness"
          value={metrics.signalEffectiveness}
          max={100}
          status={signalStatus}
        />

        <MetricDisplay
          label="Cumulative Risk"
          value={metrics.cumulativeRisk}
          max={100}
          status={riskStatus}
        />
      </div>

      {/* Survival Probability - Prominent Display */}
      <div className={`rounded-lg p-4 border-2 ${
        survivalStatus.color.includes('green')
          ? 'bg-green-950/20 border-green-600'
          : survivalStatus.color.includes('yellow')
          ? 'bg-yellow-950/20 border-yellow-600'
          : survivalStatus.color.includes('orange')
          ? 'bg-orange-950/20 border-orange-600'
          : 'bg-red-950/20 border-red-600'
      }`}>
        <div className="text-center">
          <div className="text-xs font-semibold text-slate-300 mb-1">
            SURVIVAL PROBABILITY
          </div>
          <div className={`text-3xl font-bold ${survivalStatus.color}`}>
            {Math.round(metrics.survivalProbability)}%
          </div>
          <div className={`text-xs font-medium mt-1 ${survivalStatus.color}`}>
            {survivalStatus.label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatsTab);
