import { useState } from 'react';
import type { PlayerMetrics, Scenario } from '../types/game';
import { AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
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
  getCriticalWarning
} from '../utils/statusThresholds';

interface SurvivalStatusDashboardProps {
  metrics: PlayerMetrics;
  scenario?: Scenario;
  compact?: boolean;
}

export function SurvivalStatusDashboard({ metrics, scenario, compact = false }: SurvivalStatusDashboardProps) {
  const [showEnvironmental, setShowEnvironmental] = useState(false);

  // Identify immediate threats
  const threats: string[] = [];
  ['hydration', 'energy', 'bodyTemperature', 'morale', 'shelter', 'injurySeverity'].forEach(metric => {
    const value = metrics[metric as keyof PlayerMetrics] as number;
    if (isCritical(metric, value)) {
      const warning = getCriticalWarning(metric, value);
      if (warning) threats.push(warning);
    }
  });

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-gray-700 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <span className="text-xl">⚕️</span>
          SURVIVAL STATUS
        </h2>
      </div>

      {/* Core Metrics */}
      <div className="p-5 space-y-4">
        {/* Hydration */}
        <StatBar
          label="HYDRATION"
          value={metrics.hydration}
          max={100}
          status={getHydrationStatus(metrics.hydration)}
          statusLabel={getHydrationLabel(metrics.hydration)}
          icon="💧"
          showThresholds={!compact}
          thresholds="Critical <20 | Warning 20-40 | Caution 40-60 | Safe >60"
        />

        {/* Energy */}
        <StatBar
          label="ENERGY"
          value={metrics.energy}
          max={100}
          status={getEnergyStatus(metrics.energy)}
          statusLabel={getEnergyLabel(metrics.energy)}
          icon="⚡"
          showThresholds={!compact}
          thresholds="Critical <20 | Warning 20-40 | Caution 40-60 | Safe >60"
        />

        {/* Body Temperature */}
        <StatBar
          label="BODY TEMPERATURE"
          value={metrics.bodyTemperature}
          max={42}
          min={32}
          displayValue={`${metrics.bodyTemperature.toFixed(1)}°C`}
          status={getTemperatureStatus(metrics.bodyTemperature)}
          statusLabel={getTemperatureLabel(metrics.bodyTemperature)}
          icon="🌡️"
          showThresholds={!compact}
          thresholds="32°C DANGER ← 37°C NORMAL → 42°C DANGER"
          specialScale
        />

        {/* Morale */}
        <StatBar
          label="MORALE"
          value={metrics.morale}
          max={100}
          status={getMoraleStatus(metrics.morale)}
          statusLabel={getMoraleLabel(metrics.morale)}
          icon="❤️"
          showThresholds={!compact}
          thresholds="Broken <20 | Shaken 20-40 | Steady 40-60 | Focused >60"
        />

        {/* Shelter */}
        <StatBar
          label="SHELTER QUALITY"
          value={metrics.shelter}
          max={100}
          displayValue={`${Math.round(metrics.shelter)}%`}
          status={getShelterStatus(metrics.shelter)}
          statusLabel={getShelterLabel(metrics.shelter)}
          icon="🏕️"
          showThresholds={!compact}
          thresholds="None <20 | Minimal 20-50 | Basic 50-80 | Excellent >80"
        />

        {/* Injury Severity (if present) */}
        {metrics.injurySeverity > 0 && (
          <StatBar
            label="INJURY SEVERITY"
            value={100 - metrics.injurySeverity}
            max={100}
            displayValue={`${Math.round(metrics.injurySeverity)}/100`}
            status={getInjuryStatus(metrics.injurySeverity)}
            statusLabel={getInjuryLabel(metrics.injurySeverity)}
            icon="🩹"
            inverted
          />
        )}
      </div>

      {/* Immediate Threats Section */}
      {threats.length > 0 && (
        <div className="mx-5 mb-5 p-4 bg-red-900/30 border-2 border-red-600 rounded-lg animate-pulse">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-300 font-bold text-sm mb-2 uppercase">⚠️ IMMEDIATE THREATS</h3>
              <div className="space-y-2">
                {threats.map((threat, index) => (
                  <p key={index} className="text-sm text-red-200 leading-relaxed">
                    • {threat}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Systems Nominal */}
      {threats.length === 0 && (
        <div className="mx-5 mb-5 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
          <p className="text-sm text-green-300 font-medium flex items-center gap-2">
            <span className="text-lg">✓</span>
            All systems nominal - no immediate threats
          </p>
        </div>
      )}

      {/* Environmental Conditions (Collapsible) */}
      {scenario && (
        <div className="border-t border-gray-700">
          <button
            onClick={() => setShowEnvironmental(!showEnvironmental)}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Environmental Conditions
            </span>
            {showEnvironmental ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {showEnvironmental && (
            <div className="px-5 pb-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">Ambient Temp</div>
                <div className={`text-base font-mono font-bold ${
                  scenario.temperature < 0 ? 'text-blue-400' :
                  scenario.temperature < 10 ? 'text-cyan-400' :
                  scenario.temperature > 35 ? 'text-red-400' :
                  scenario.temperature > 25 ? 'text-orange-400' :
                  'text-green-400'
                }`}>
                  {scenario.temperature}°C
                </div>
              </div>

              <div className="p-3 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">Wind Speed</div>
                <div className="text-base font-mono font-bold text-gray-300">
                  {scenario.windSpeed} km/h
                </div>
              </div>

              <div className="col-span-2 p-3 bg-gray-800/50 rounded">
                <div className="text-xs text-gray-500 mb-1">Weather</div>
                <div className="text-sm text-gray-300 capitalize">
                  {scenario.weather}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  min?: number;
  displayValue?: string;
  status: any;
  statusLabel: string;
  icon: string;
  showThresholds?: boolean;
  thresholds?: string;
  specialScale?: boolean;
  inverted?: boolean;
}

function StatBar({
  label,
  value,
  max,
  min = 0,
  displayValue,
  status,
  statusLabel,
  icon,
  showThresholds,
  thresholds,
  specialScale,
  inverted
}: StatBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate percentage for bar
  let percentage: number;
  if (specialScale && label === 'BODY TEMPERATURE') {
    // Special handling for temperature scale (32-42°C)
    percentage = ((value - 32) / (42 - 32)) * 100;
  } else {
    percentage = ((value - min) / (max - min)) * 100;
  }

  // Invert for injury (higher injury = worse)
  const displayPercentage = inverted ? 100 - percentage : percentage;
  const barPercentage = Math.max(0, Math.min(100, displayPercentage));

  const isCriticalStat = status.label === 'CRITICAL';

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-300
        ${isCriticalStat ? `${status.bgColor} ${status.borderColor} animate-pulse` : 'bg-gray-800/30 border-gray-700'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{icon}</span>
          <h3 className="text-sm font-bold text-gray-300 tracking-wide truncate">{label}</h3>
          {showThresholds && (
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="relative flex-shrink-0"
            >
              <Info className="w-3 h-3 text-gray-500 hover:text-gray-300" />
              {showTooltip && thresholds && (
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-950 border border-gray-600 rounded shadow-xl text-xs text-gray-300 z-50">
                  {thresholds}
                </div>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-lg sm:text-xl font-mono font-bold text-gray-100 whitespace-nowrap">
            {displayValue || Math.round(value)}
            {!displayValue && `/${max}`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="h-3 bg-gray-900 rounded-full overflow-hidden relative">
          {/* Show critical marker for temperature */}
          {specialScale && label === 'BODY TEMPERATURE' && (
            <>
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" title="37°C Normal" />
            </>
          )}

          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${barPercentage}%`,
              backgroundColor: status.color
            }}
          />
        </div>
      </div>

      {/* Status Label */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold uppercase tracking-wider`}
          style={{ color: status.textColor }}
        >
          {status.label}: {statusLabel}
        </span>
      </div>
    </div>
  );
}
