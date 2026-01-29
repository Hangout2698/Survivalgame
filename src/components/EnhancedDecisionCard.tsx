import { useState } from 'react';
import type { Decision, GameState } from '../types/game';
import { ChevronUp, AlertTriangle, TrendingDown, TrendingUp, Info, Package, Thermometer } from 'lucide-react';
import { calculateDecisionInfo, getEffortLevel, getSuccessLabel } from '../engine/decisionCalculator';
import { getEquipmentRequirements, hasRequiredEquipment } from '../engine/equipmentMapper';

interface EnhancedDecisionCardProps {
  decision: Decision;
  gameState: GameState;
  onSelect: (decision: Decision) => void;
  disabled?: boolean;
}

export function EnhancedDecisionCard({ decision, gameState, onSelect, disabled = false }: EnhancedDecisionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate all decision information
  const calc = calculateDecisionInfo(decision, gameState);
  const effortLevel = getEffortLevel(decision.energyCost);
  const successInfo = getSuccessLabel(calc.successProbability);

  // Get equipment requirements
  const equipmentReqs = getEquipmentRequirements(decision, gameState);
  const equipmentCheck = hasRequiredEquipment(decision, gameState);

  // Effort level styling
  const effortStyles = {
    light: {
      badge: 'bg-green-900/40 border-green-600 text-green-300',
      symbol: '◆',
      label: 'Light'
    },
    moderate: {
      badge: 'bg-yellow-900/40 border-yellow-600 text-yellow-300',
      symbol: '◆◆',
      label: 'Moderate'
    },
    extreme: {
      badge: 'bg-red-900/40 border-red-600 text-red-300',
      symbol: '◆◆◆',
      label: 'Extreme'
    }
  };

  const effortStyle = effortStyles[effortLevel];

  // Risk level styling
  const riskStyles = {
    safe: { bg: 'bg-green-900/20', border: 'border-green-700', glow: '' },
    manageable: { bg: 'bg-blue-900/20', border: 'border-blue-700', glow: '' },
    risky: { bg: 'bg-yellow-900/20', border: 'border-yellow-600', glow: 'shadow-yellow-600/20' },
    dangerous: { bg: 'bg-orange-900/20', border: 'border-orange-600', glow: 'shadow-lg shadow-orange-600/30' },
    critical: { bg: 'bg-red-900/30', border: 'border-red-600', glow: 'shadow-lg shadow-red-600/40 animate-pulse' }
  };

  const riskStyle = riskStyles[calc.riskLevel];

  // Determine if costs are critical
  const energyCritical = calc.postDecisionState.energy < 20;
  const hydrationCritical = calc.postDecisionState.hydration < 25;
  const tempCritical = calc.postDecisionState.bodyTemperature < 35;

  return (
    <div
      className={`
        rounded-lg border-2 transition-all duration-300
        ${riskStyle.bg} ${riskStyle.border} ${riskStyle.glow}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl cursor-pointer'}
      `}
    >
      {/* TIER 1: Primary Information (Always Visible) */}
      <button
        onClick={() => !disabled && onSelect(decision)}
        disabled={disabled}
        className="w-full text-left p-4 md:p-5 min-h-[88px]"
      >
        <div className="flex items-start justify-between gap-2 md:gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-gray-100 mb-2 leading-tight">
              {decision.text}
            </h3>

            {/* Environmental Hint */}
            {decision.environmentalHint && (
              <div className="mt-2 mb-3 px-2 md:px-3 py-1.5 md:py-2 bg-blue-900/20 border border-blue-700/30 rounded text-xs md:text-sm text-blue-300 flex items-start gap-2">
                <Info className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
                <span>{decision.environmentalHint}</span>
              </div>
            )}

            {/* Effort and Time Row - Simplified on mobile */}
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 flex-wrap">
              <div className={`px-2 md:px-3 py-1 rounded-full border-2 ${effortStyle.badge} font-bold text-xs md:text-sm whitespace-nowrap`}>
                {effortStyle.symbol} <span className="hidden md:inline">{effortStyle.label}</span>
              </div>
              <div className="text-xs md:text-sm text-gray-400 flex items-center gap-1">
                <span className="text-sm md:text-base">⏱️</span>
                {decision.timeRequired}h
              </div>
              {/* Risk indicator - icon only on mobile, full text on desktop */}
              <div className={`text-xs md:text-sm flex items-center gap-1 ${decision.riskLevel >= 7 ? 'text-red-400' : decision.riskLevel >= 5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="md:inline">{decision.riskLevel}</span>
                <span className="hidden md:inline">/10</span>
              </div>
            </div>

            {/* Cost Summary - Compact on mobile */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm md:text-base">
              {/* Energy Cost */}
              <div className={`flex items-center gap-1 md:gap-1.5 ${energyCritical ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                <span className="text-base md:text-lg">⚡</span>
                <span className="text-xs md:text-base">{calc.energyCost > 0 ? '+' : ''}{calc.energyCost}</span>
                {energyCritical && <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />}
              </div>

              {/* Hydration Cost */}
              {calc.hydrationCost !== 0 && (
                <div className={`flex items-center gap-1 md:gap-1.5 ${hydrationCritical ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                  <span className="text-base md:text-lg">💧</span>
                  <span className="text-xs md:text-base">-{calc.hydrationCost}</span>
                  {hydrationCritical && <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />}
                </div>
              )}

              {/* Temperature Change - Icon indicator visible on all screens */}
              {calc.temperatureChange !== 0 && (
                <div className={`flex items-center gap-1 md:gap-1.5 ${tempCritical ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>
                  <Thermometer className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-base">{calc.temperatureChange > 0 ? '+' : ''}{calc.temperatureChange.toFixed(1)}</span>
                  <span className="hidden sm:inline text-xs md:text-base">°C</span>
                  {tempCritical && <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />}
                </div>
              )}

              {/* Success Probability */}
              <div className={`flex items-center gap-1 md:gap-1.5 ${successInfo.color} font-semibold`}>
                <span className="text-sm md:text-base">{successInfo.icon}</span>
                <span className="text-xs md:text-base">{Math.round(calc.successProbability * 100)}%</span>
              </div>
            </div>

            {/* Equipment Requirements - Compact on mobile */}
            {equipmentReqs.length > 0 && (
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                  <span className="text-[10px] md:text-xs font-semibold text-gray-400">Equipment:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {equipmentReqs.map((req, idx) => {
                    const hasEnough = req.currentQuantity >= req.quantity;
                    const isMissing = req.required && !hasEnough;

                    return (
                      <div
                        key={idx}
                        className={`
                          flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs
                          ${isMissing
                            ? 'bg-red-900/30 border border-red-600 text-red-300'
                            : req.consumed
                              ? 'bg-orange-900/20 border border-orange-700 text-orange-200'
                              : 'bg-gray-800 border border-gray-700 text-gray-300'
                          }
                        `}
                      >
                        <span className="text-sm md:text-base">{req.icon}</span>
                        <span className="font-medium hidden md:inline">{req.name}</span>

                        {req.consumed && (
                          <span className="text-[10px] text-orange-400">
                            (-{req.quantity})
                          </span>
                        )}

                        <span className={`text-[10px] font-mono ${isMissing ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                          {req.currentQuantity}/{req.quantity}
                        </span>

                        {isMissing && (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Missing equipment warning */}
                {!equipmentCheck.hasAll && (
                  <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Missing required: {equipmentCheck.missing.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expand/Collapse Button - Bigger touch target on mobile */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-2 md:p-2 hover:bg-gray-700/30 active:bg-gray-700/50 rounded-lg transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={expanded ? "Hide details" : "Show details"}
          >
            <Info className="w-5 h-5 md:w-5 md:h-5 text-gray-400" />
          </button>
        </div>

        {/* Warnings (if any) - Smaller on mobile */}
        {calc.warnings.length > 0 && !expanded && (
          <div className="mt-2 md:mt-3 p-2 md:p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-red-300 font-medium">
                {calc.warnings[0]}
              </p>
            </div>
          </div>
        )}
      </button>

      {/* TIER 2: Detailed Information (Expandable) */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-700">
          {/* Success Probability Breakdown */}
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Success Probability: <span className={successInfo.color}>{successInfo.label}</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Base success rate:</span>
                <span className="text-gray-200 font-mono">
                  {Math.round(calc.successFactors.baseRate * 100)}%
                </span>
              </div>
              {calc.successFactors.environmentalModifier !== 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Environmental modifier:</span>
                  <span className={`font-mono ${calc.successFactors.environmentalModifier < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {calc.successFactors.environmentalModifier > 0 ? '+' : ''}
                    {Math.round(calc.successFactors.environmentalModifier * 100)}%
                  </span>
                </div>
              )}
              {calc.successFactors.playerStateModifier !== 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Your condition modifier:</span>
                  <span className={`font-mono ${calc.successFactors.playerStateModifier < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {calc.successFactors.playerStateModifier > 0 ? '+' : ''}
                    {Math.round(calc.successFactors.playerStateModifier * 100)}%
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-700 flex justify-between">
                <span className="text-gray-300 font-semibold">Final probability:</span>
                <span className={`font-mono font-bold ${successInfo.color}`}>
                  {Math.round(calc.successProbability * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <span className="text-lg">⚡</span>
              Energy Cost Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Base cost ({decision.timeRequired}h {effortLevel} effort):</span>
                <span className="text-gray-200 font-mono">-{calc.costBreakdown.baseCost}</span>
              </div>
              {calc.costBreakdown.environmentalMultiplier !== 1.0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Environmental multiplier:</span>
                  <span className="text-orange-400 font-mono">
                    ×{calc.costBreakdown.environmentalMultiplier.toFixed(2)}
                  </span>
                </div>
              )}
              {calc.costBreakdown.conditionMultiplier !== 1.0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Condition multiplier:</span>
                  <span className={`font-mono ${calc.costBreakdown.conditionMultiplier > 1 ? 'text-red-400' : 'text-green-400'}`}>
                    ×{calc.costBreakdown.conditionMultiplier.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-700 flex justify-between">
                <span className="text-gray-300 font-semibold">Total cost:</span>
                <span className="text-red-400 font-mono font-bold">
                  -{calc.costBreakdown.finalCost}
                </span>
              </div>
            </div>
          </div>

          {/* Post-Decision State */}
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <span className="text-lg">📊</span>
              After This Action
            </h4>
            <div className="space-y-3">
              <StatChangeRow
                icon="⚡"
                label="Energy"
                current={gameState.metrics.energy}
                predicted={calc.postDecisionState.energy}
                unit=""
                criticalThreshold={20}
                warningThreshold={35}
              />
              <StatChangeRow
                icon="💧"
                label="Hydration"
                current={gameState.metrics.hydration}
                predicted={calc.postDecisionState.hydration}
                unit=""
                criticalThreshold={25}
                warningThreshold={40}
              />
              <StatChangeRow
                icon="🌡️"
                label="Body Temp"
                current={gameState.metrics.bodyTemperature}
                predicted={calc.postDecisionState.bodyTemperature}
                unit="°C"
                criticalThreshold={35}
                warningThreshold={36}
              />
            </div>
          </div>

          {/* Warnings */}
          {calc.warnings.length > 0 && (
            <div className="p-4 bg-red-900/20 border-2 border-red-700 rounded-lg">
              <h4 className="text-sm font-bold text-red-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Assessment
              </h4>
              <ul className="space-y-1.5">
                {calc.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-red-200 flex items-start gap-2">
                    <span className="text-red-400 font-bold mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critical Thresholds */}
          {calc.criticalThresholds.length > 0 && (
            <div className="p-4 bg-orange-900/20 border-2 border-orange-600 rounded-lg">
              <h4 className="text-sm font-bold text-orange-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Critical Thresholds Crossed
              </h4>
              <ul className="space-y-1.5">
                {calc.criticalThresholds.map((threshold, idx) => (
                  <li key={idx} className="text-sm text-orange-200 flex items-start gap-2">
                    <span className="text-orange-400 font-bold mt-0.5">⚠️</span>
                    <span>{threshold}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Environmental Context */}
          <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <h4 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
              <span className="text-lg">🌬️</span>
              Current Conditions
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Weather</span>
                <div className="text-gray-200 capitalize">{gameState.scenario.weather}</div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Temperature</span>
                <div className="text-gray-200">{gameState.scenario.temperature}°C</div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Wind</span>
                <div className="text-gray-200">{gameState.scenario.windSpeed} km/h</div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Time</span>
                <div className="text-gray-200 capitalize">{gameState.currentTimeOfDay}</div>
              </div>
            </div>
          </div>

          {/* Toggle back */}
          <button
            onClick={() => setExpanded(false)}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronUp className="w-4 h-4" />
            Hide Details
          </button>
        </div>
      )}
    </div>
  );
}

interface StatChangeRowProps {
  icon: string;
  label: string;
  current: number;
  predicted: number;
  unit: string;
  criticalThreshold: number;
  warningThreshold: number;
}

function StatChangeRow({
  icon,
  label,
  current,
  predicted,
  unit,
  criticalThreshold,
  warningThreshold
}: StatChangeRowProps) {
  const change = predicted - current;
  const isCritical = predicted < criticalThreshold;
  const isWarning = predicted < warningThreshold && !isCritical;

  const statusColor = isCritical ? 'text-red-400' :
                      isWarning ? 'text-orange-400' :
                      'text-gray-300';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300 font-mono">
          {current.toFixed(unit === '°C' ? 1 : 0)}{unit}
        </span>
        <span className="text-gray-500">→</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono font-bold ${statusColor}`}>
            {predicted.toFixed(unit === '°C' ? 1 : 0)}{unit}
          </span>
          {change !== 0 && (
            <span className={`text-xs font-mono ${change < 0 ? 'text-red-400' : 'text-green-400'} flex items-center gap-0.5`}>
              {change < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {change > 0 ? '+' : ''}{change.toFixed(unit === '°C' ? 1 : 0)}
            </span>
          )}
        </div>
        {isCritical && <AlertTriangle className="w-4 h-4 text-red-400" />}
      </div>
    </div>
  );
}
