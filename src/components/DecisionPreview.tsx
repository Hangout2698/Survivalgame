import { AlertTriangle, TrendingDown, TrendingUp, Info } from 'lucide-react';
import type { Decision, GameState } from '../types/game';

interface DecisionPreviewProps {
  decision: Decision;
  state: GameState;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DecisionPreview({ decision, state, onConfirm, onCancel }: DecisionPreviewProps) {
  // Predict energy cost
  const baseEnergyCost = decision.energyCost;
  const { energy, hydration, injurySeverity } = state.metrics;

  // Calculate condition multiplier (same logic as scaleEnergyCost)
  let conditionMultiplier = 1.0;
  if (energy < 30 || hydration < 30 || injurySeverity > 50) {
    conditionMultiplier = 1.4;
  } else if (energy < 50 || hydration < 50 || injurySeverity > 30) {
    conditionMultiplier = 1.2;
  } else if (decision.riskLevel <= 2 && energy >= 70 && hydration >= 60 && injurySeverity < 20) {
    conditionMultiplier = 0.6;
  }

  // Calculate environmental multiplier
  let envMultiplier = 1.0;
  if (state.scenario.weather === 'storm' || state.scenario.weather === 'snow') envMultiplier += 0.4;
  else if (state.scenario.weather === 'rain') envMultiplier += 0.2;
  if (state.scenario.temperature < 0) envMultiplier += 0.3;
  else if (state.scenario.temperature < 10) envMultiplier += 0.2;
  if (state.currentTimeOfDay === 'night') envMultiplier += 0.15;

  const predictedEnergyCost = Math.round(baseEnergyCost * conditionMultiplier * envMultiplier);
  const predictedEnergyAfter = energy - predictedEnergyCost;

  // Predict hydration loss (rough estimate)
  const activityIntensity = decision.energyCost > 35 ? 3 : decision.energyCost > 20 ? 2 : 1;
  const baseHydrationDrain = Math.ceil(decision.timeRequired / 2);
  const predictedHydrationCost = baseHydrationDrain * activityIntensity +
    (state.scenario.temperature < 10 ? Math.ceil(decision.timeRequired * 1.5) : 0);
  const predictedHydrationAfter = hydration - predictedHydrationCost;

  // Predict temperature change
  let predictedTempChange = 0;
  if (!decision.id.includes('shelter') && !decision.id.includes('rest')) {
    if (state.scenario.temperature < 10) predictedTempChange = -0.5;
    else if (state.scenario.temperature > 35) predictedTempChange = -0.3;
  }
  const predictedTempAfter = state.metrics.bodyTemperature + predictedTempChange;

  // Determine recommended energy threshold
  const recommendedEnergy = decision.energyCost > 40 ? 70 : decision.energyCost > 30 ? 60 : 50;

  // Determine risk level
  const isDangerous = predictedEnergyAfter < 10 || predictedHydrationAfter < 20 || predictedTempAfter < 34;
  const isRisky = predictedEnergyAfter < 30 || predictedHydrationAfter < 40 || (energy < recommendedEnergy && decision.riskLevel > 5);

  // Check weather conditions
  const isWhiteout = state.scenario.weather === 'storm' || state.scenario.weather === 'snow';
  const isNight = state.currentTimeOfDay === 'night' || state.currentTimeOfDay === 'dusk';

  // Generate warnings
  const warnings: string[] = [];
  if (predictedEnergyAfter < 10) {
    warnings.push('CRITICAL: This will deplete your energy to dangerous levels (collapse risk)');
  } else if (predictedEnergyAfter < 30) {
    warnings.push('WARNING: Low energy after this action - you may not be able to perform critical tasks');
  } else if (energy < recommendedEnergy) {
    warnings.push(`CAUTION: Your current energy (${energy}) is below recommended (${recommendedEnergy}+) for this action`);
  }

  if (predictedHydrationAfter < 20) {
    warnings.push('CRITICAL: Severe dehydration risk - organ failure possible');
  } else if (predictedHydrationAfter < 40) {
    warnings.push('WARNING: Dehydration will become critical after this action');
  }

  if (predictedTempAfter < 34) {
    warnings.push('CRITICAL: Hypothermia risk - body temperature dropping to dangerous levels');
  } else if (predictedTempAfter < 35.5) {
    warnings.push('WARNING: Body temperature approaching hypothermia threshold');
  }

  if (isWhiteout && decision.id.includes('navigate')) {
    warnings.push('EXTREME RISK: Navigation in whiteout conditions has near-zero success rate');
  }

  if (isNight && (decision.id.includes('navigate') || decision.id.includes('travel'))) {
    warnings.push('HIGH RISK: Traveling at night significantly increases injury and navigation failure risk');
  }

  const isHighRisk = warnings.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`max-w-2xl w-full bg-gradient-to-br from-gray-900 via-gray-950 to-black border-2 rounded-2xl shadow-2xl ${
        isDangerous ? 'border-red-600/70' : isRisky ? 'border-orange-600/70' : 'border-blue-600/70'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b-2 ${
          isDangerous ? 'bg-red-900/40 border-red-600/50' :
          isRisky ? 'bg-orange-900/40 border-orange-600/50' :
          'bg-blue-900/40 border-blue-600/50'
        }`}>
          <div className="flex items-start gap-3">
            {isHighRisk && <AlertTriangle className="w-7 h-7 text-orange-400 animate-pulse flex-shrink-0" />}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-100 mb-1">{decision.text}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>⚡ Effort: {decision.riskLevel <= 3 ? 'Light' : decision.riskLevel <= 6 ? 'Moderate' : 'Extreme'}</span>
                <span>⏱️ Time: {decision.timeRequired}h</span>
                <span>📊 Risk Level: {decision.riskLevel}/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-5 bg-red-900/30 border-2 border-red-600 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-300 font-bold text-sm mb-2 uppercase">⚠️ Risk Assessment</h3>
                  <div className="space-y-2">
                    {warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-red-200 leading-relaxed">
                        • {warning}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Predicted Consequences */}
          <div>
            <h3 className="text-base font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Predicted Consequences (based on current condition)
            </h3>

            <div className="space-y-3">
              {/* Energy */}
              <PredictionRow
                label="Energy"
                icon="⚡"
                current={energy}
                predicted={predictedEnergyAfter}
                change={-predictedEnergyCost}
                reason={`${decision.timeRequired}h ${decision.riskLevel > 6 ? 'extreme' : 'moderate'} effort in ${state.scenario.weather} conditions`}
                status={predictedEnergyAfter < 10 ? 'critical' : predictedEnergyAfter < 30 ? 'warning' : 'ok'}
                recommendation={energy < recommendedEnergy ? `Recommended: ${recommendedEnergy}+ for this action` : undefined}
              />

              {/* Hydration */}
              <PredictionRow
                label="Hydration"
                icon="💧"
                current={hydration}
                predicted={predictedHydrationAfter}
                change={-predictedHydrationCost}
                reason={`Physical activity in ${state.scenario.temperature < 10 ? 'cold, dry air' : state.scenario.temperature > 30 ? 'heat' : 'ambient conditions'}`}
                status={predictedHydrationAfter < 20 ? 'critical' : predictedHydrationAfter < 40 ? 'warning' : 'ok'}
              />

              {/* Body Temperature */}
              {predictedTempChange !== 0 && (
                <PredictionRow
                  label="Body Temp"
                  icon="🌡️"
                  current={state.metrics.bodyTemperature}
                  predicted={predictedTempAfter}
                  change={predictedTempChange}
                  reason={`Cold exposure during ${decision.timeRequired}h activity`}
                  status={predictedTempAfter < 34 ? 'critical' : predictedTempAfter < 35.5 ? 'warning' : 'ok'}
                  unit="°C"
                />
              )}
            </div>
          </div>

          {/* Overall Assessment */}
          <div className={`p-4 rounded-lg border-2 ${
            isDangerous ? 'bg-red-900/20 border-red-600' :
            isRisky ? 'bg-orange-900/20 border-orange-600' :
            'bg-green-900/20 border-green-600'
          }`}>
            <p className={`text-sm font-medium ${
              isDangerous ? 'text-red-300' :
              isRisky ? 'text-orange-300' :
              'text-green-300'
            }`}>
              {isDangerous
                ? '🔴 CRITICAL RISK: This action is extremely dangerous given your current condition. Consider alternatives.'
                : isRisky
                ? '🟠 HIGH RISK: This action carries significant risk. Ensure you have contingency plans.'
                : '🟢 MANAGEABLE: You are adequately prepared for this action.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              ← Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-colors ${
                isDangerous
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : isRisky
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isDangerous ? 'Proceed Anyway (Dangerous) →' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PredictionRowProps {
  label: string;
  icon: string;
  current: number;
  predicted: number;
  change: number;
  reason: string;
  status: 'critical' | 'warning' | 'ok';
  recommendation?: string;
  unit?: string;
}

function PredictionRow({
  label,
  icon,
  current,
  predicted,
  change,
  reason,
  status,
  recommendation,
  unit = ''
}: PredictionRowProps) {
  const statusColor = status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-orange-400' : 'text-gray-400';
  const changeColor = change < 0 ? 'text-red-300' : 'text-green-300';

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-200">{label}</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">
            {current.toFixed(1)}{unit} → <span className={statusColor}>{predicted.toFixed(1)}{unit}</span>
            {status === 'critical' && ' ⚠️'}
          </div>
          <div className={`text-xs font-mono font-bold ${changeColor} flex items-center justify-end gap-1`}>
            {change < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{change.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-400 leading-relaxed">
        {reason}
      </div>
      {recommendation && (
        <div className="mt-2 text-xs text-yellow-400 italic">
          ℹ️ {recommendation}
        </div>
      )}
    </div>
  );
}
