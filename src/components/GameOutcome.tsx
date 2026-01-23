import type { GameState } from '../types/game';
import { AlertTriangle, Check, X, TrendingUp, TrendingDown, Award, BookOpen, Clock, Skull } from 'lucide-react';
import { getCategories, getPrinciplesByCategory } from '../engine/survivalPrinciplesService';
import type { PrincipleCategory } from '../engine/survivalPrinciplesService';
import { getFailureFact } from '../data/survivalFacts';

interface GameOutcomeProps {
  state: GameState;
  onNewGame: () => void;
}

// Helper function to calculate category performance
function calculateCategoryPerformance(state: GameState): Record<string, number> {
  const scores: Record<string, number> = {};
  const categories = getCategories();

  categories.forEach(category => {
    const categoryDecisions = [...(state.goodDecisions || []), ...(state.poorDecisions || [])].filter(d => {
      // Check if principle mentions category
      return d.principle.toLowerCase().includes(category.toLowerCase());
    });

    if (categoryDecisions.length === 0) {
      scores[category] = 50; // No data
    } else {
      const goodCount = (state.goodDecisions || []).filter(d =>
        d.principle.toLowerCase().includes(category.toLowerCase())
      ).length;
      scores[category] = Math.round((goodCount / categoryDecisions.length) * 100);
    }
  });

  return scores;
}

// Helper function to get learning recommendations
function getLearningRecommendations(state: GameState): string[] {
  const categoryScores = calculateCategoryPerformance(state);
  const weakCategories = Object.entries(categoryScores)
    .filter(([_, score]) => score < 50)
    .sort(([_, a], [__, b]) => a - b)
    .slice(0, 2)
    .map(([cat, _]) => cat);

  if (weakCategories.length === 0) {
    return ['You demonstrated strong survival knowledge across all categories!'];
  }

  const recommendations: string[] = [];
  weakCategories.forEach(category => {
    const principles = getPrinciplesByCategory(category as PrincipleCategory);
    if (principles.length > 0) {
      recommendations.push(`Focus on ${category}: ${principles[0]}`);
    }
  });

  return recommendations;
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

  // Get survival science fact for death scenarios
  const survivalFact = state.outcome === 'died'
    ? getFailureFact(state.metrics, state.lessons?.[0])
    : null;

  // Calculate hours/days survived for Rule of 3s
  const hoursSurvived = state.hoursElapsed || (state.turnNumber * 2);
  const daysSurvived = Math.floor(hoursSurvived / 24);
  const remainingHours = hoursSurvived % 24;

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

      {/* SURVIVAL SCIENCE SECTION - Only for deaths */}
      {survivalFact && (
        <div className="relative overflow-hidden rounded-lg border-2 border-red-600/50 bg-gradient-to-br from-red-900/30 via-gray-900 to-gray-900 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />

          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skull className="w-7 h-7 text-red-400" />
              <h3 className="text-xl font-bold text-red-400">{survivalFact.cause}</h3>
            </div>

            {/* Rule of 3s Banner */}
            <div className="mb-6 p-4 bg-gray-800/80 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <h4 className="text-sm font-semibold text-yellow-400">SURVIVAL TIME</h4>
              </div>
              <p className="text-2xl font-mono text-gray-100 mb-1">
                {daysSurvived > 0 ? `${daysSurvived}d ${remainingHours}h` : `${remainingHours} hours`}
              </p>
              <p className="text-sm text-gray-400 italic">
                {survivalFact.ruleOfThrees}
              </p>
            </div>

            {/* The Science Section */}
            <div className="mb-6 p-5 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/40">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h4 className="text-base font-bold text-blue-400">THE SCIENCE: {survivalFact.title}</h4>
              </div>
              <div className="space-y-3">
                {survivalFact.facts.map((fact, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-300">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{fact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What You Should Have Done */}
            <div className="p-5 bg-green-900/20 rounded-lg border border-green-800/40">
              <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                <span>💡</span>
                WHAT WOULD HAVE SAVED YOU
              </h4>
              <div className="space-y-2">
                {survivalFact.prevention.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-400 text-lg leading-none">▸</span>
                    <p className="text-sm text-gray-200 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* END SURVIVAL SCIENCE SECTION */}

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

      <div className="p-5 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-medium text-gray-300 mb-4 flex items-center gap-2">
          <span>📊</span>
          Principle Mastery
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(calculateCategoryPerformance(state)).map(([category, score]) => (
            <div key={category} className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span className="text-sm text-gray-400 capitalize">{category}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className={`text-xs font-mono ${score >= 70 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-900/10 border border-blue-800/40 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
          <span>🎓</span>
          Learning Path
        </h4>
        <div className="space-y-2">
          {getLearningRecommendations(state).map((rec, i) => (
            <p key={i} className="text-sm text-gray-300 leading-relaxed">
              • {rec}
            </p>
          ))}
        </div>
      </div>

      <button
        onClick={onNewGame}
        className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors font-medium"
      >
        Start New Scenario
      </button>
    </div>
  );
}
