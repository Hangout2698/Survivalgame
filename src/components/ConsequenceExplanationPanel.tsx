import { useState } from 'react';
import type { ConsequenceExplanation } from '../types/game';
import { AlertTriangle, ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Activity, Lightbulb } from 'lucide-react';

interface ConsequenceExplanationPanelProps {
  explanation: ConsequenceExplanation;
  metricsChange: any;
}

export function ConsequenceExplanationPanel({ explanation, metricsChange }: ConsequenceExplanationPanelProps) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [showMechanical, setShowMechanical] = useState(false);

  const getRiskColor = (assessment: ConsequenceExplanation['riskAssessment']) => {
    switch (assessment) {
      case 'critical': return { bg: 'bg-red-900/40', border: 'border-red-600', text: 'text-red-300', icon: '🔴' };
      case 'dangerous': return { bg: 'bg-orange-900/40', border: 'border-orange-600', text: 'text-orange-300', icon: '🟠' };
      case 'risky': return { bg: 'bg-yellow-900/40', border: 'border-yellow-600', text: 'text-yellow-300', icon: '🟡' };
      case 'manageable': return { bg: 'bg-blue-900/40', border: 'border-blue-600', text: 'text-blue-300', icon: '🔵' };
      case 'safe': return { bg: 'bg-green-900/40', border: 'border-green-600', text: 'text-green-300', icon: '🟢' };
    }
  };

  const riskStyle = getRiskColor(explanation.riskAssessment);

  return (
    <div className="space-y-4">
      {/* TIER 1: Quick Summary */}
      <div className={`p-6 rounded-xl border-2 ${riskStyle.bg} ${riskStyle.border}`}>
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{riskStyle.icon}</span>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${riskStyle.text} mb-2`}>
              {explanation.riskAssessment.toUpperCase()} OUTCOME
            </h3>
            <p className="text-gray-200 leading-relaxed text-lg">
              {explanation.summary}
            </p>
          </div>
        </div>

        {/* Quick stat changes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Object.entries(metricsChange).map(([key, value]) => {
            if (value === 0 || value === undefined || value === null || typeof value !== 'number') return null;
            const isNegative = (key !== 'cumulativeRisk' && key !== 'injurySeverity') ? value < 0 : value > 0;

            return (
              <div key={key} className={`p-3 rounded-lg ${isNegative ? 'bg-red-900/40' : 'bg-green-900/40'}`}>
                <div className="text-xs text-gray-400 capitalize mb-1">
                  {formatMetricName(key)}
                </div>
                <div className={`text-xl font-mono font-bold flex items-center gap-1 ${
                  isNegative ? 'text-red-300' : 'text-green-300'
                }`}>
                  {isNegative ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {value > 0 ? '+' : ''}{value.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TIER 2: Detailed Explanation (Expandable) */}
      <div className="bg-gray-800/50 border-2 border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-semibold text-gray-200">
              Why Did This Happen?
            </span>
          </div>
          {showDetailed ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showDetailed && (
          <div className="px-6 pb-6 space-y-6">
            {/* Detailed Narrative */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-base font-bold text-gray-300 mb-3 flex items-center gap-2">
                <span className="text-xl">📖</span>
                The Full Story
              </h4>
              <p className="text-gray-300 leading-relaxed">
                {explanation.detailedNarrative}
              </p>
            </div>

            {/* Environmental Conditions */}
            <div className="p-5 bg-blue-900/20 border border-blue-800/40 rounded-lg">
              <h4 className="text-base font-bold text-blue-300 mb-3 flex items-center gap-2">
                <span className="text-xl">🌬️</span>
                Environmental Conditions at Decision Time
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Weather</div>
                  <div className="text-gray-200 font-medium capitalize">
                    {explanation.environmentalFactors.weather}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Temperature</div>
                  <div className="text-gray-200 font-medium">
                    {explanation.environmentalFactors.temperature}°C
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Wind Speed</div>
                  <div className="text-gray-200 font-medium">
                    {explanation.environmentalFactors.windSpeed} km/h
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Visibility</div>
                  <div className="text-gray-200 font-medium capitalize">
                    {explanation.environmentalFactors.visibility === 'whiteout' ? '❌ Whiteout' :
                     explanation.environmentalFactors.visibility === 'poor' ? '⚠️ Poor' :
                     explanation.environmentalFactors.visibility === 'reduced' ? '⚡ Reduced' : '✓ Clear'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Time of Day</div>
                  <div className="text-gray-200 font-medium capitalize">
                    {explanation.environmentalFactors.timeOfDay}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Challenge Level</div>
                  <div className={`font-bold ${
                    explanation.environmentalFactors.challengeMultiplier > 1.3 ? 'text-red-400' :
                    explanation.environmentalFactors.challengeMultiplier > 1.15 ? 'text-orange-400' :
                    explanation.environmentalFactors.challengeMultiplier > 1.0 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {explanation.environmentalFactors.challengeMultiplier.toFixed(2)}x
                  </div>
                </div>
              </div>
            </div>

            {/* Player Condition */}
            <div className="p-5 bg-purple-900/20 border border-purple-800/40 rounded-lg">
              <h4 className="text-base font-bold text-purple-300 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Your Physical Condition
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Energy Level</div>
                  <div className={`font-bold ${
                    explanation.playerFactors.energyLevel < 30 ? 'text-red-400' :
                    explanation.playerFactors.energyLevel < 50 ? 'text-orange-400' :
                    explanation.playerFactors.energyLevel < 70 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {Math.round(explanation.playerFactors.energyLevel)}/100
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Hydration</div>
                  <div className={`font-bold ${
                    explanation.playerFactors.hydrationLevel < 30 ? 'text-red-400' :
                    explanation.playerFactors.hydrationLevel < 50 ? 'text-orange-400' :
                    explanation.playerFactors.hydrationLevel < 70 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {Math.round(explanation.playerFactors.hydrationLevel)}/100
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Body Temp</div>
                  <div className={`font-bold ${
                    explanation.playerFactors.bodyTemp < 35 ? 'text-blue-400' :
                    explanation.playerFactors.bodyTemp < 36.5 ? 'text-cyan-400' :
                    explanation.playerFactors.bodyTemp > 38 ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {explanation.playerFactors.bodyTemp.toFixed(1)}°C
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Energy Deficit</div>
                  <div className={`font-bold ${
                    explanation.playerFactors.energyDeficiency > 30 ? 'text-red-400' :
                    explanation.playerFactors.energyDeficiency > 10 ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {explanation.playerFactors.energyDeficiency > 0 ? '-' : ''}{Math.round(explanation.playerFactors.energyDeficiency)}
                    {explanation.playerFactors.energyDeficiency > 0 ? ' below recommended' : ' (adequate)'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Condition Penalty</div>
                  <div className={`font-bold ${
                    explanation.playerFactors.conditionMultiplier > 1.3 ? 'text-red-400' :
                    explanation.playerFactors.conditionMultiplier > 1.15 ? 'text-orange-400' :
                    explanation.playerFactors.conditionMultiplier > 1.0 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {explanation.playerFactors.conditionMultiplier.toFixed(2)}x
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {explanation.recommendations && explanation.recommendations.length > 0 && (
              <div className="p-5 bg-orange-900/20 border-2 border-orange-600/50 rounded-lg">
                <h4 className="text-base font-bold text-orange-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  What You Should Do Next
                </h4>
                <ul className="space-y-2">
                  {explanation.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="text-orange-400 font-bold mt-0.5">▸</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lesson Learned */}
            {explanation.lessonLearned && (
              <div className="p-5 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-2 border-purple-600/50 rounded-lg">
                <h4 className="text-base font-bold text-purple-300 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Survival Principle Learned
                </h4>
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  💡 {explanation.lessonLearned}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TIER 3: Mechanical Breakdown (Expandable) */}
      <div className="bg-gray-800/50 border-2 border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowMechanical(!showMechanical)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="text-lg font-semibold text-gray-200">
              Show Detailed Stats Calculation
            </span>
          </div>
          {showMechanical ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showMechanical && (
          <div className="px-6 pb-6 space-y-4">
            {/* Energy Breakdown */}
            {explanation.metricBreakdowns.energy && (
              <MetricBreakdownDisplay
                name="Energy"
                icon="⚡"
                breakdown={explanation.metricBreakdowns.energy}
                color="text-yellow-400"
              />
            )}

            {/* Hydration Breakdown */}
            {explanation.metricBreakdowns.hydration && (
              <MetricBreakdownDisplay
                name="Hydration"
                icon="💧"
                breakdown={explanation.metricBreakdowns.hydration}
                color="text-blue-400"
              />
            )}

            {/* Temperature Breakdown */}
            {explanation.metricBreakdowns.bodyTemperature && (
              <MetricBreakdownDisplay
                name="Body Temperature"
                icon="🌡️"
                breakdown={explanation.metricBreakdowns.bodyTemperature}
                color="text-cyan-400"
              />
            )}

            {/* Morale Breakdown */}
            {explanation.metricBreakdowns.morale && (
              <MetricBreakdownDisplay
                name="Morale"
                icon="❤️"
                breakdown={explanation.metricBreakdowns.morale}
                color="text-pink-400"
              />
            )}

            {/* Risk Breakdown */}
            {explanation.metricBreakdowns.cumulativeRisk && (
              <MetricBreakdownDisplay
                name="Cumulative Risk"
                icon="⚠️"
                breakdown={explanation.metricBreakdowns.cumulativeRisk}
                color="text-orange-400"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricBreakdownDisplayProps {
  name: string;
  icon: string;
  breakdown: any;
  color: string;
}

function MetricBreakdownDisplay({ name, icon, breakdown, color }: MetricBreakdownDisplayProps) {
  return (
    <div className="pt-4 border-t border-gray-700">
      <h5 className={`text-base font-bold ${color} mb-3 flex items-center gap-2`}>
        <span className="text-xl">{icon}</span>
        {name} Change: {breakdown.finalChange > 0 ? '+' : ''}{breakdown.finalChange.toFixed(1)}
      </h5>

      {/* Calculation formula */}
      {breakdown.calculation && (
        <div className="mb-3 p-3 bg-gray-900/50 rounded font-mono text-xs text-gray-400">
          {breakdown.calculation}
        </div>
      )}

      {/* Detailed reasons */}
      <div className="space-y-2">
        {breakdown.reasons.map((reason: any, idx: number) => (
          <div key={idx} className="flex items-start gap-3 text-sm">
            <div className={`px-2 py-1 rounded font-mono font-bold flex-shrink-0 ${
              reason.amount < 0 ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'
            }`}>
              {reason.amount > 0 ? '+' : ''}{reason.amount}
            </div>
            <div className="flex-1">
              <div className="text-gray-300">{reason.reason}</div>
              <div className="text-xs text-gray-500 capitalize mt-0.5">
                ({reason.category} factor)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMetricName(key: string): string {
  const names: Record<string, string> = {
    energy: 'Energy',
    hydration: 'Hydration',
    bodyTemperature: 'Body Temp',
    morale: 'Morale',
    shelter: 'Shelter',
    injurySeverity: 'Injury',
    cumulativeRisk: 'Risk',
    signalEffectiveness: 'Signal'
  };
  return names[key] || key;
}
