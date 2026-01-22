import type { GameState } from '../types/game';
import { AlertTriangle, Check, X, TrendingUp, TrendingDown, Award } from 'lucide-react';

interface GameOutcomeProps {
  state: GameState;
  onNewGame: () => void;
}

export function GameOutcome({ state, onNewGame }: GameOutcomeProps) {
  if (!state.outcome) return null;

  const outcomeConfig = {
    survived: {
      icon: Check,
      title: 'Congratulations - You Were Rescued!',
      subtitle: 'Your disciplined approach and sound decision-making led to your successful rescue.',
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-800'
    },
    barely_survived: {
      icon: AlertTriangle,
      title: 'You Were Rescued',
      subtitle: 'You survived, though some critical errors made your ordeal more dangerous than necessary.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-800'
    },
    died: {
      icon: X,
      title: 'Mission Failed',
      subtitle: 'Poor decisions and survival mistakes led to a fatal outcome.',
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-800'
    }
  };

  const config = outcomeConfig[state.outcome];
  const Icon = config.icon;

  const goodDecisions = state.goodDecisions || [];
  const poorDecisions = state.poorDecisions || [];
  const signalAttempts = state.signalAttempts || 0;
  const successfulSignals = state.successfulSignals || 0;

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className={`p-6 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`w-8 h-8 ${config.color}`} />
          <h2 className={`text-2xl font-light ${config.color}`}>{config.title}</h2>
        </div>
        <p className="text-gray-300 leading-relaxed mb-4">{config.subtitle}</p>

        {state.lessons && state.lessons.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-gray-700">
            {state.lessons.map((lesson, index) => (
              <p key={index} className="text-sm text-gray-400 leading-relaxed">
                {lesson}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800 rounded border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Turns Survived</div>
          <div className="text-2xl font-mono text-gray-200">{state.turnNumber - 1}</div>
        </div>
        <div className="p-4 bg-gray-800 rounded border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Signals Sent</div>
          <div className="text-2xl font-mono text-gray-200">{successfulSignals}/{signalAttempts}</div>
        </div>
        <div className="p-4 bg-gray-800 rounded border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Survival Score</div>
          <div className="text-2xl font-mono text-gray-200">{Math.round(state.metrics.survivalProbability)}</div>
        </div>
      </div>

      {goodDecisions.length > 0 && (
        <div className="p-5 bg-green-900/10 rounded-lg border border-green-800/50">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-medium text-green-400">Good Decisions</h3>
            <span className="text-sm text-green-500 ml-auto">{goodDecisions.length} correct choices</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {goodDecisions.map((decision, index) => (
              <div key={index} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="text-xs text-gray-500 font-mono mt-0.5 flex-shrink-0">
                    Turn {decision.turn}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 mb-1">{decision.description}</p>
                    <p className="text-xs text-green-400">{decision.principle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {poorDecisions.length > 0 && (
        <div className="p-5 bg-red-900/10 rounded-lg border border-red-800/50">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-medium text-red-400">Mistakes Made</h3>
            <span className="text-sm text-red-500 ml-auto">{poorDecisions.length} poor choices</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {poorDecisions.map((decision, index) => (
              <div key={index} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="text-xs text-gray-500 font-mono mt-0.5 flex-shrink-0">
                    Turn {decision.turn}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 mb-1">{decision.description}</p>
                    <p className="text-xs text-red-400">{decision.principle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.outcome === 'survived' && goodDecisions.length > poorDecisions.length && (
        <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-800/50 flex items-start gap-3">
          <Award className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">Excellent Performance</h4>
            <p className="text-sm text-gray-300">
              Your ratio of good to poor decisions demonstrates strong survival knowledge.
              You prioritized the fundamentals: shelter, signaling, and resource management.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onNewGame}
        className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors font-medium"
      >
        Start New Scenario
      </button>
    </div>
  );
}
