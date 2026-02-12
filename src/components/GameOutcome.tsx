import type { GameState } from '../types/game';
import { AlertTriangle, Check, X, TrendingUp, TrendingDown, Award, BookOpen, Clock, Skull } from 'lucide-react';
import { getCategories, getPrinciplesByCategory } from '../engine/survivalPrinciplesService';
import type { PrincipleCategory } from '../engine/survivalPrinciplesService';
import { getFailureFact } from '../data/survivalFacts';
import DecisionTimeline from './DecisionTimeline';
import { LearningSummary } from './LearningSummary';

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
    .filter(([, score]) => score < 50)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([cat]) => cat);

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

// Helper function to generate narrative variation based on rescue method and condition
function getEndingNarrative(state: GameState): { title: string; description: string } {
  const outcome = state.outcome;
  const successfulSignals = state.successfulSignals || 0;
  const navigationAttempts = state.history.filter(h => h.wasNavigationSuccess).length;
  const turnNumber = state.turnNumber;
  const injured = state.metrics.injurySeverity > 30;
  const dehydrated = state.metrics.hydration < 40;
  const exhausted = state.metrics.energy < 35;
  const hypothermic = state.metrics.bodyTemperature < 36;

  if (outcome === 'survived') {
    // Signal-based rescue
    if (successfulSignals >= 4) {
      if (injured || dehydrated) {
        return {
          title: 'Rescued by Strategic Signaling - Medical Evacuation',
          description: 'Your persistent and well-timed signals were spotted by search aircraft. Despite your injuries and declining condition, your discipline in signaling saved your life. Paramedics provided immediate treatment during the helicopter extraction.'
        };
      }
      return {
        title: 'Rescued by Expert Signaling',
        description: 'Your systematic and strategic signaling campaign paid off. Search and rescue teams triangulated your position from multiple signal sightings. You maintained discipline, prioritized survival fundamentals, and executed textbook signaling technique.'
      };
    }

    // Navigation-based rescue
    if (navigationAttempts >= 2) {
      if (exhausted) {
        return {
          title: 'Reached Safety Through Determination',
          description: 'Despite extreme exhaustion, you navigated to safety through pure determination. Your terrain-reading skills and navigation decisions brought you to a populated area. You collapsed upon arrival but were immediately given medical attention.'
        };
      }
      return {
        title: 'Self-Rescued Through Expert Navigation',
        description: 'You demonstrated exceptional wilderness navigation skills. Rather than waiting for rescue, you assessed the terrain, made strategic decisions, and successfully navigated to safety. Your physical conditioning and mental discipline enabled this impressive self-rescue.'
      };
    }

    // Endurance-based rescue
    if (turnNumber >= 15) {
      if (hypothermic || injured) {
        return {
          title: 'Survived by Establishing Base Camp',
          description: 'You prioritized shelter, fire, and water - building a sustainable base camp that allowed you to endure until scheduled rescue arrived. Despite harsh conditions causing hypothermia and injuries, your fundamentals-first approach kept you alive long enough to be found.'
        };
      }
      return {
        title: 'Textbook Survival - Rescued on Schedule',
        description: 'You executed a perfect survival strategy. Shelter, fire, and water were prioritized. You avoided panic, made sound decisions, and maintained your survival probability until the scheduled search window. This is exactly how survival situations should be managed.'
        };
    }

    // Default survived
    return {
      title: 'Rescued Successfully',
      description: 'Through a combination of signaling, smart decisions, and survival discipline, you were rescued. Your approach demonstrated solid fundamentals and effective decision-making under pressure.'
    };
  }

  if (outcome === 'barely_survived') {
    if (injured && dehydrated) {
      return {
        title: 'Barely Survived - Multiple Critical Errors',
        description: 'Rescue arrived just in time. Severe dehydration and untreated injuries nearly proved fatal. Your survival was more luck than skill. Critical mistakes in water management and injury care compounded into a life-threatening situation. Long recovery ahead.'
      };
    }

    if (hypothermic) {
      return {
        title: 'Hypothermic Rescue - Shelter Neglect',
        description: 'You were found with dangerously low body temperature. Failure to prioritize shelter and fire management resulted in progressive hypothermia. Rescue teams administered emergency warming protocols. This outcome could easily have been fatal.'
      };
    }

    return {
      title: 'Rescued - Poor Condition',
      description: 'You survived but made several critical errors that severely degraded your condition. Rescue found you in declining health. Better prioritization and decision-making would have prevented unnecessary suffering.'
    };
  }

  // Death narratives
  if (outcome === 'died') {
    if (state.metrics.bodyTemperature <= 32) {
      return {
        title: 'Death by Hypothermia',
        description: 'Progressive heat loss overwhelmed your body\'s ability to maintain core temperature. Shelter and fire were neglected. Hypothermia is preventable with proper priorities - this death was avoidable.'
      };
    }

    if (state.metrics.hydration <= 5) {
      return {
        title: 'Death by Dehydration',
        description: 'Severe dehydration led to circulatory collapse and organ failure. Water should have been your top priority after shelter. The Rule of 3s: 3 minutes without air, 3 hours without shelter (extreme cold), 3 days without water, 3 weeks without food.'
      };
    }

    if (state.metrics.energy <= 3) {
      return {
        title: 'Death by Exhaustion',
        description: 'Complete energy depletion led to collapse. Poor energy management - attempting high-cost actions while in poor condition - caused fatal exhaustion. Energy is finite; every action has a cost.'
      };
    }

    if (state.metrics.injurySeverity >= 90) {
      return {
        title: 'Death from Injury Complications',
        description: 'Untreated injuries worsened until they became unsurvivable. High-risk decisions while injured, failure to use first aid resources, and continued physical exertion accelerated decline. Injury management is critical.'
      };
    }

    return {
      title: 'Fatal Cascade of Poor Decisions',
      description: 'Multiple poor decisions compounded into a fatal outcome. Survival requires discipline, prioritization, and risk assessment. Each bad decision made the next one harder to recover from.'
    };
  }

  return { title: '', description: '' };
}

// Helper function to calculate survival rating
function getSurvivalRating(state: GameState): { rank: string; score: number; description: string } {
  let score = 0;

  // Base score from outcome
  if (state.outcome === 'survived') score += 40;
  else if (state.outcome === 'barely_survived') score += 20;

  // Turns survived (max 20 points)
  score += Math.min(20, state.turnNumber);

  // Principle alignment (max 20 points)
  score += Math.round((state.principleAlignmentScore || 0) * 0.2);

  // Final condition bonus (max 15 points)
  if (state.metrics.energy > 60) score += 5;
  if (state.metrics.hydration > 60) score += 5;
  if (state.metrics.injurySeverity < 20) score += 5;

  // Efficiency bonus (max 5 points)
  const goodDecisionRatio = (state.goodDecisions?.length || 0) / Math.max(1, state.turnNumber);
  score += Math.round(goodDecisionRatio * 5);

  // Determine rank
  let rank = '';
  let description = '';

  if (score >= 85) {
    rank = 'Master Survivor';
    description = 'Exceptional wilderness survival skills. You would thrive in extreme conditions.';
  } else if (score >= 70) {
    rank = 'Expert Survivor';
    description = 'Strong survival knowledge and decision-making. You handle crises effectively.';
  } else if (score >= 55) {
    rank = 'Competent Survivor';
    description = 'Solid fundamentals with room for improvement. You make mostly sound decisions.';
  } else if (score >= 40) {
    rank = 'Novice Survivor';
    description = 'Basic survival skills present but inconsistent application. More training needed.';
  } else {
    rank = 'Beginner';
    description = 'Significant gaps in survival knowledge. Study principles and practice decision-making.';
  }

  return { rank, score, description };
}

// Helper function to get key decision points
function getKeyDecisionPoints(state: GameState): Array<{ turn: number; description: string; impact: 'positive' | 'negative' }> {
  const keyPoints: Array<{ turn: number; description: string; impact: 'positive' | 'negative' }> = [];

  // Check for critical decisions
  state.history.forEach((outcome, index) => {
    const turn = index + 1;

    // Excellent decisions
    if (outcome.decisionQuality === 'excellent') {
      keyPoints.push({
        turn,
        description: `${outcome.decision.text} - ${outcome.survivalPrincipleAlignment || 'Excellent execution'}`,
        impact: 'positive'
      });
    }

    // Critical errors
    if (outcome.decisionQuality === 'critical-error' || outcome.decision.riskLevel >= 9) {
      keyPoints.push({
        turn,
        description: `${outcome.decision.text} - High risk decision`,
        impact: 'negative'
      });
    }

    // Major injuries
    if (outcome.metricsChange.injurySeverity && outcome.metricsChange.injurySeverity >= 20) {
      keyPoints.push({
        turn,
        description: `Suffered major injury (${outcome.decision.text})`,
        impact: 'negative'
      });
    }

    // Successful signals
    if (outcome.wasSuccessfulSignal) {
      keyPoints.push({
        turn,
        description: 'Successful rescue signal sent',
        impact: 'positive'
      });
    }

    // Navigation success
    if (outcome.wasNavigationSuccess) {
      keyPoints.push({
        turn,
        description: 'Major navigation progress',
        impact: 'positive'
      });
    }
  });

  // Get turning point (biggest survival probability change)
  let maxProbChange = 0;
  let turningPoint = 0;
  for (let i = 1; i < state.history.length; i++) {
    const change = Math.abs((state.history[i].metricsChange.survivalProbability || 0));
    if (change > maxProbChange) {
      maxProbChange = change;
      turningPoint = i + 1;
    }
  }

  if (turningPoint > 0 && maxProbChange > 10) {
    const outcome = state.history[turningPoint - 1];
    const direction = (outcome.metricsChange.survivalProbability || 0) > 0 ? 'increased' : 'decreased';
    keyPoints.push({
      turn: turningPoint,
      description: `Turning point: Survival probability ${direction} significantly`,
      impact: direction === 'increased' ? 'positive' : 'negative'
    });
  }

  return keyPoints.slice(0, 5); // Top 5 most important
}

export function GameOutcome({ state, onNewGame }: GameOutcomeProps) {
  if (!state.outcome) return null;

  // Get custom narrative and rating
  const narrative = getEndingNarrative(state);
  const rating = getSurvivalRating(state);
  const keyDecisions = getKeyDecisionPoints(state);

  const outcomeConfig = {
    survived: {
      icon: Check,
      color: 'text-green-400',
      bgColor: 'bg-green-900/90',
      borderColor: 'border-green-800'
    },
    barely_survived: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/90',
      borderColor: 'border-yellow-800'
    },
    died: {
      icon: X,
      color: 'text-red-400',
      bgColor: 'bg-red-900/90',
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
      {/* Custom Ending Narrative */}
      <div className={`p-6 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`w-8 h-8 ${config.color}`} />
          <h2 className={`text-2xl font-light ${config.color}`}>{narrative.title}</h2>
        </div>
        <p className="text-white leading-relaxed mb-4">{narrative.description}</p>

        {state.lessons && state.lessons.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-gray-700">
            {state.lessons.map((lesson, index) => (
              <p key={index} className="text-sm text-gray-100 leading-relaxed">
                {lesson}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Survival Rating */}
      <div className="p-5 bg-gradient-to-br from-purple-900/90 to-blue-900/90 rounded-lg border border-purple-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-medium text-purple-400">Survival Rating</h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-300">{rating.score}/100</div>
          </div>
        </div>
        <div className="mb-3">
          <div className="inline-block px-4 py-2 bg-purple-900/40 rounded-lg border border-purple-700">
            <span className="text-xl font-semibold text-purple-200">{rating.rank}</span>
          </div>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed">{rating.description}</p>
      </div>

      {/* Key Decision Points */}
      {keyDecisions.length > 0 && (
        <div className="p-5 bg-gray-800/90 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-blue-400">Key Decision Points</h3>
          </div>
          <div className="space-y-3">
            {keyDecisions.map((point, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  point.impact === 'positive'
                    ? 'bg-green-900/20 border-green-800/50'
                    : 'bg-red-900/20 border-red-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xs text-gray-400 font-mono mt-0.5 flex-shrink-0">
                    Turn {point.turn}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${point.impact === 'positive' ? 'text-green-300' : 'text-red-300'}`}>
                      {point.description}
                    </p>
                  </div>
                  {point.impact === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAUSALITY ANALYSIS - Only for deaths with causality chain */}
      {state.outcome === 'died' && state.causalityChain && (
        <div className="p-5 bg-gray-800/90 rounded-lg border border-red-700">
          <div className="flex items-center gap-2 mb-4">
            <Skull className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-medium text-red-400">What Killed You: Root Cause Analysis</h3>
          </div>

          <div className="mb-4 p-4 bg-red-900/90 rounded-lg border border-red-800">
            <div className="text-sm font-semibold text-red-300 mb-2">
              The Critical Mistake (Turn {state.causalityChain.rootCauseDecision.turn})
            </div>
            <div className="text-base text-white mb-2">
              "{state.causalityChain.rootCauseDecision.decisionText}"
            </div>
            <div className="text-sm text-gray-100">
              {state.causalityChain.rootCauseDecision.immediateEffect}
            </div>
          </div>

          <DecisionTimeline
            state={state}
            highlightRootCauseTurn={state.causalityChain.rootCauseDecision.turn}
            highlightPointOfNoReturn={state.causalityChain.fatalThreshold.turn}
          />
        </div>
      )}

      {/* SURVIVAL SCIENCE SECTION - Only for deaths */}
      {survivalFact && (
        <div className="relative overflow-hidden rounded-lg border-2 border-red-600 bg-gradient-to-br from-red-900/90 via-gray-900 to-gray-900 shadow-2xl">
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
              <p className="text-sm text-gray-100 italic">
                {survivalFact.ruleOfThrees}
              </p>
            </div>

            {/* The Science Section */}
            <div className="mb-6 p-5 bg-gradient-to-br from-blue-900/90 to-purple-900/90 rounded-lg border border-blue-800">
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
                    <p className="text-sm text-white leading-relaxed">{fact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What You Should Have Done */}
            <div className="p-5 bg-green-900/90 rounded-lg border border-green-800">
              <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                <span>💡</span>
                WHAT WOULD HAVE SAVED YOU
              </h4>
              <div className="space-y-2">
                {survivalFact.prevention.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-400 text-lg leading-none">▸</span>
                    <p className="text-sm text-white leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* END SURVIVAL SCIENCE SECTION */}

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800/90 rounded border border-gray-700">
          <div className="text-sm text-gray-100 mb-1">Turns Survived</div>
          <div className="text-2xl font-mono text-white">{state.turnNumber - 1}</div>
        </div>
        <div className="p-4 bg-gray-800/90 rounded border border-gray-700">
          <div className="text-sm text-gray-100 mb-1">Signals Sent</div>
          <div className="text-2xl font-mono text-white">{successfulSignals}/{signalAttempts}</div>
        </div>
        <div className="p-4 bg-gray-800/90 rounded border border-gray-700">
          <div className="text-sm text-gray-100 mb-1">Survival Score</div>
          <div className="text-2xl font-mono text-white">{Math.round(state.metrics.survivalProbability)}</div>
        </div>
      </div>

      {goodDecisions.length > 0 && (
        <div className="p-5 bg-green-900/90 rounded-lg border border-green-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-medium text-green-400">Good Decisions</h3>
            <span className="text-sm text-green-300 ml-auto">{goodDecisions.length} correct choices</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {goodDecisions.map((decision, index) => (
              <div key={index} className="p-3 bg-gray-800/90 rounded border border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="text-xs text-gray-300 font-mono mt-0.5 flex-shrink-0">
                    Turn {decision.turn}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white mb-1">{decision.description}</p>
                    <p className="text-xs text-green-400">{decision.principle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {poorDecisions.length > 0 && (
        <div className="p-5 bg-red-900/90 rounded-lg border border-red-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-medium text-red-400">Mistakes Made</h3>
            <span className="text-sm text-red-300 ml-auto">{poorDecisions.length} poor choices</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {poorDecisions.map((decision, index) => (
              <div key={index} className="p-3 bg-gray-800/90 rounded border border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="text-xs text-gray-300 font-mono mt-0.5 flex-shrink-0">
                    Turn {decision.turn}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white mb-1">{decision.description}</p>
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

      {/* Learning Summary - Shows session progress and knowledge tracking */}
      <LearningSummary />

      <button
        onClick={onNewGame}
        className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors font-medium"
      >
        Start New Scenario
      </button>
    </div>
  );
}
