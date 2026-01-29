import type { GameState, CausalityChain } from '../types/game';

interface FailureExplanationModalProps {
  state: GameState;
  causalityChain?: CausalityChain;
  onClose: () => void;
}

export default function FailureExplanationModal({
  state,
  causalityChain,
  onClose
}: FailureExplanationModalProps) {
  if (!causalityChain) {
    // No causality chain available, close immediately
    onClose();
    return null;
  }

  const metrics = state.metrics;
  const fatalMetric = causalityChain.fatalThreshold.metric;

  // Determine what killed the player
  let deathCause = '';
  let fatalValue = '';
  let fatalThreshold = '';

  if (fatalMetric === 'bodyTemperature') {
    if (metrics.bodyTemperature <= 31.5) {
      deathCause = 'SEVERE HYPOTHERMIA';
      fatalValue = `${metrics.bodyTemperature.toFixed(1)}°C`;
      fatalThreshold = '31.5°C';
    } else {
      deathCause = 'HYPERTHERMIA';
      fatalValue = `${metrics.bodyTemperature.toFixed(1)}°C`;
      fatalThreshold = '41.5°C';
    }
  } else if (fatalMetric === 'energy') {
    deathCause = 'COMPLETE EXHAUSTION';
    fatalValue = `${metrics.energy.toFixed(0)}/100`;
    fatalThreshold = '3';
  } else if (fatalMetric === 'hydration') {
    deathCause = 'SEVERE DEHYDRATION';
    fatalValue = `${metrics.hydration.toFixed(0)}/100`;
    fatalThreshold = '5';
  } else if (fatalMetric === 'injurySeverity') {
    deathCause = 'FATAL INJURIES';
    fatalValue = `${metrics.injurySeverity.toFixed(0)}/100`;
    fatalThreshold = '90';
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border-2 border-red-600 rounded-lg max-w-4xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 p-6 border-b-2 border-red-600">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">💀</span>
            <h2 className="text-3xl font-bold text-white">DEATH FROM {deathCause}</h2>
          </div>
          <div className="text-red-200 text-sm">Causality Analysis</div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Fatal Condition */}
          <div className="bg-gray-800 border border-red-500 rounded-lg p-4">
            <h3 className="text-lg font-bold text-red-400 mb-3">Fatal Condition</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400 mb-1">Primary Cause</div>
                <div className="text-red-300 font-bold">{deathCause}</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Final Value</div>
                <div className="text-red-300 font-bold">{fatalValue}</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Fatal Threshold</div>
                <div className="text-red-300 font-bold">{fatalThreshold}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-400">
              <div>Energy: {metrics.energy.toFixed(0)}/100</div>
              <div>Hydration: {metrics.hydration.toFixed(0)}/100</div>
              <div>Body Temp: {metrics.bodyTemperature.toFixed(1)}°C</div>
            </div>
          </div>

          {/* Root Cause Analysis */}
          <div className="bg-gray-800 border border-orange-500 rounded-lg p-4">
            <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center gap-2">
              <span>🔍</span>
              ROOT CAUSE ANALYSIS
            </h3>
            <div className="bg-gray-900 rounded p-3 mb-3">
              <div className="text-xs text-gray-400 mb-1">The Critical Mistake (Turn {causalityChain.rootCauseDecision.turn})</div>
              <div className="text-amber-300 font-bold mb-2">"{causalityChain.rootCauseDecision.decisionText}"</div>
              <div className="text-sm text-gray-300">{causalityChain.rootCauseDecision.immediateEffect}</div>
            </div>
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-orange-300 mb-2">Why this killed you:</p>
              <p className="leading-relaxed">
                This decision created a cascade of consequences that your body could not recover from.
                {causalityChain.cascadeSteps.length > 2 && ` Over ${causalityChain.cascadeSteps.length} turns, `}
                {fatalMetric === 'energy' && ' it depleted your energy reserves, preventing rest and other survival actions.'}
                {fatalMetric === 'hydration' && ' it accelerated dehydration without providing a path to water.'}
                {fatalMetric === 'bodyTemperature' && ' it pushed your body temperature beyond survivable limits.'}
                {fatalMetric === 'injurySeverity' && ' it caused injuries that compounded over time.'}
              </p>
            </div>
          </div>

          {/* Cascade Timeline */}
          <div className="bg-gray-800 border border-amber-500 rounded-lg p-4">
            <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
              <span>⏱️</span>
              HOW THE CASCADE UNFOLDED
            </h3>
            <div className="space-y-2">
              {causalityChain.cascadeSteps.map((step, index) => {
                let icon = '•';
                let iconColor = 'text-gray-400';
                let bgColor = 'bg-gray-900';

                if (step.severity === 'critical') {
                  icon = '💀';
                  iconColor = 'text-red-500';
                  bgColor = 'bg-red-900/20';
                } else if (step.severity === 'high') {
                  icon = '🔴';
                  iconColor = 'text-orange-500';
                  bgColor = 'bg-orange-900/20';
                } else if (step.severity === 'medium') {
                  icon = '⚠️';
                  iconColor = 'text-yellow-500';
                  bgColor = 'bg-yellow-900/10';
                } else if (index === 0) {
                  icon = '✓';
                  iconColor = 'text-green-500';
                }

                return (
                  <div key={index} className={`${bgColor} rounded p-3 flex gap-3`}>
                    <div className={`${iconColor} text-xl flex-shrink-0`}>{icon}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-sm font-semibold text-gray-300">Turn {step.turn}</div>
                        <div className="text-xs text-gray-400">{step.metricChange}</div>
                      </div>
                      <div className="text-sm text-gray-400">{step.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alternative Path */}
          {causalityChain.alternativePath && (
            <div className="bg-gray-800 border border-green-500 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                <span>✅</span>
                WHAT WOULD HAVE SAVED YOU
              </h3>
              <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                {causalityChain.alternativePath}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg"
          >
            Continue to Full Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
