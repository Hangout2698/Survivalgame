import { useState, useEffect } from 'react';
import type { GameState, Decision, PlayerMetrics, Scenario } from '../types/game';
import { createNewGame, makeDecision, getAvailableDecisions } from '../engine/gameController';
import { generateBriefing, generateConciseBrief } from '../engine/briefingGenerator';
import { getEnvironmentTips } from '../engine/survivalPrinciplesService';
import { generateScenario } from '../engine/scenarioGenerator';
import { useInventory } from '../contexts/InventoryContext';
import { ITEM_DATABASE } from '../data/itemDatabase';
import { getTriggeredTutorialScenario, type TutorialScenario } from '../data/tutorialScenarios';
import type { PlayerStats } from './StatusHUD';
import { DangerVignette } from './DangerVignette';
import { ActionHistory } from './ActionHistory';
import { LoadoutScreen } from './LoadoutScreen';
import { InventoryTray } from './InventoryTray';
import { TutorialScenarioModal } from './TutorialScenarioModal';
import { DecisionList } from './DecisionList';
import { GameOutcome } from './GameOutcome';
import { DynamicEnvironmentBackground } from './DynamicEnvironmentBackground';
import { DecisionIllustration } from './DecisionIllustration';
import { ConsequenceExplanationPanel } from './ConsequenceExplanationPanel';
import { ObjectiveDisplay } from './ObjectiveDisplay';
import { ScenarioHeroImage } from './ScenarioHeroImage';
import InformationDashboard from './InformationDashboard';
import { CriticalStatsAlert } from './CriticalStatsAlert';
import FailureExplanationModal from './FailureExplanationModal';
import { SurvivalDebriefCard } from './SurvivalDebriefCard';
import type { PrincipleCategory } from '../engine/survivalPrinciplesService';
import { startSession, endSession, getCurrentSessionPrinciples } from '../engine/knowledgeTracker';
import { IconLegendModal } from './IconLegendModal';
import { CloudSnow, HelpCircle } from 'lucide-react';

export function Game() {
  const { resetConsumption, selectedItems } = useInventory();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loadoutComplete, setLoadoutComplete] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameLoadError, setGameLoadError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [recentOutcome, setRecentOutcome] = useState<string>('');
  const [showOutcome, setShowOutcome] = useState(false);
  const [lastDecisionId, setLastDecisionId] = useState<string>('');
  const [currentTutorialScenario, setCurrentTutorialScenario] = useState<TutorialScenario | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [showMobileStatus, setShowMobileStatus] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [showFailureExplanation, setShowFailureExplanation] = useState(false);
  const [currentDebrief, setCurrentDebrief] = useState<{
    principle: string;
    category: PrincipleCategory;
  } | null>(null);
  const [showIconLegend, setShowIconLegend] = useState(false);

  // Generate scenario on component mount (before loadout selection)
  useEffect(() => {
    if (!scenario) {
      setScenario(generateScenario());
    }
  }, [scenario]);

  // Check if this is the first time viewing the status button (per session)
  useEffect(() => {
    const hasSeenStatusButton = sessionStorage.getItem('hasSeenStatusButton');
    if (!hasSeenStatusButton) {
      setShowPulse(true);
      // Stop pulsing after 5 seconds or when button is clicked
      setTimeout(() => setShowPulse(false), 5000);
    }
  }, []);

  // Mark status button as seen when clicked
  const handleStatusButtonClick = () => {
    sessionStorage.setItem('hasSeenStatusButton', 'true');
    setShowPulse(false);
    setShowMobileStatus(true);
  };

  // Swipe gesture handlers for drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartTime(Date.now());
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const distance = touchEndY - touchStartY;
    const duration = touchEndTime - touchStartTime;
    const velocity = Math.abs(distance) / duration;

    // Close drawer if swiped down more than 100px or velocity > 0.5
    if (distance > 100 || velocity > 0.5) {
      setShowMobileStatus(false);
    }
  };

  // Convert game metrics to simplified PlayerStats for HUD
  const getPlayerStats = (state: GameState | null): PlayerStats => {
    if (!state) {
      return { bodyHeat: 80, hydration: 100, energy: 100, morale: 100 };
    }

    // Map bodyTemperature (32-42°C) to bodyHeat (0-100)
    const tempRange = 42 - 32;
    const tempOffset = state.metrics.bodyTemperature - 32;
    const bodyHeat = Math.round((tempOffset / tempRange) * 100);

    return {
      bodyHeat: Math.max(0, Math.min(100, bodyHeat)),
      hydration: Math.round(state.metrics.hydration),
      energy: Math.round(state.metrics.energy),
      morale: Math.round(state.metrics.morale)
    };
  };

  useEffect(() => {
    // Only create game after loadout is complete
    if (loadoutComplete && !gameState && !gameLoadError && scenario) {
      // Convert selected items from inventory context to Equipment format
      const equipment = selectedItems.map(itemId => {
        const item = ITEM_DATABASE[itemId];
        return {
          name: item.name,
          quantity: 1,
          condition: 'good' as const,
          volumeLiters: item.volumeLiters
        };
      });

      createNewGame(scenario, equipment)
        .then(newState => {
          setGameState(newState);
          // Start knowledge tracking session
          startSession(newState.id, newState.scenario.environment);
        })
        .catch((error) => {
          console.error('Failed to create game:', error);
          setGameLoadError('Failed to initialize game. Please try again.');
        });
    }
  }, [loadoutComplete, gameState, gameLoadError, scenario, selectedItems]);
  useEffect(() => {
    if (gameState && gameState.status === 'active') {
      // Check for tutorial scenario triggers
      const tutorialScenario = getTriggeredTutorialScenario(gameState);
      if (tutorialScenario && !completedTutorials.has(tutorialScenario.id)) {
        setCurrentTutorialScenario(tutorialScenario);
        return; // Don't load regular decisions while tutorial is active
      }

      const newDecisions = getAvailableDecisions(gameState);
      setDecisions(newDecisions);
    }
  }, [gameState, completedTutorials]);

  const handleDecision = (decision: Decision) => {
    if (!gameState) return;

    // Auto-close mobile status drawer when decision is made
    setShowMobileStatus(false);

    setRecentOutcome('');
    setLastDecisionId('');
    setCurrentDebrief(null); // Clear previous debrief

    const newState = makeDecision(gameState, decision);
    const lastOutcome = newState.history[newState.history.length - 1];

    setLastDecisionId(decision.id);
    setRecentOutcome(lastOutcome.immediateEffect);
    setGameState(newState);

    // Show survival debrief if lesson learned exists AND not already shown this session
    if (lastOutcome.explanation?.lessonLearned) {
      const principle = lastOutcome.explanation.lessonLearned;
      const sessionPrinciples = getCurrentSessionPrinciples();

      // Only show if this exact principle hasn't been shown this session
      if (!sessionPrinciples.includes(principle)) {
        // Determine category from decision ID
        const categoryMap: Record<string, PrincipleCategory> = {
          'shelter': 'shelter',
          'improve': 'shelter',
          'fire': 'fire',
          'water': 'water',
          'signal': 'signaling',
          'navigate': 'navigation',
          'treat': 'firstAid',
          'rest': 'psychology',
          'scout': 'priorities',
          'forage': 'food',
          'purify': 'water',
          'hunt': 'food',
          'fish': 'food',
          'blanket': 'shelter',
          'whistle': 'signaling',
          'mirror': 'signaling',
          'flashlight': 'signaling'
        };

        let category: PrincipleCategory = 'priorities';
        for (const [key, cat] of Object.entries(categoryMap)) {
          if (decision.id.includes(key)) {
            category = cat;
            break;
          }
        }

        // Show debrief quickly (reduced from 800ms for better flow)
        setTimeout(() => {
          setCurrentDebrief({
            principle,
            category
          });
        }, 400);
      }
    }

    // Principle unlock modal removed - was causing UX friction
    // Principles now only shown via debrief card

    // Notification removed - redundant with consequence panel immediate effect
    // Reduces visual noise and modal fatigue

    if (newState.status === 'ended') {
      // End knowledge tracking session
      if (newState.outcome) {
        endSession(newState.outcome);
      }

      // If player died and we have causality chain, show failure explanation first
      if (newState.outcome === 'died' && newState.causalityChain) {
        setTimeout(() => setShowFailureExplanation(true), 1000);
      } else {
        setTimeout(() => setShowOutcome(true), 1000);
      }
    }
  };

  const handleNewGame = async () => {
    setRecentOutcome('');
    setShowOutcome(false);
    setShowFailureExplanation(false);
    setLastDecisionId('');
    setGameState(null);
    setGameLoadError(null);
    // Don't reset loadoutComplete - keep the same equipment for next game
    // setLoadoutComplete(false);
    setScenario(null); // Reset scenario to generate a new one
    // Reset consumed items and restore uses, but keep same equipment selection
    resetConsumption();
  };

  const handleCloseFailureExplanation = () => {
    setShowFailureExplanation(false);
    setTimeout(() => setShowOutcome(true), 300);
  };

  const handleLoadoutComplete = () => {
    setLoadoutComplete(true);
  };

  const handleTutorialChoice = (choiceId: string) => {
    if (!currentTutorialScenario || !gameState) return;

    const choice = currentTutorialScenario.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Apply tutorial scenario outcome to game state
    const updatedMetrics: PlayerMetrics = { ...gameState.metrics };
    Object.entries(choice.outcome.metricsChange).forEach(([key, value]) => {
      if (key in updatedMetrics && typeof value === 'number') {
        const metricKey = key as keyof PlayerMetrics;
        if (metricKey in updatedMetrics) {
          const currentValue = updatedMetrics[metricKey] as number;
          updatedMetrics[metricKey] = Math.max(0, Math.min(100, currentValue + value)) as never;
        }
      }
    });

    // Update game state with tutorial outcome
    const updatedState: GameState = {
      ...gameState,
      metrics: updatedMetrics,
      turnNumber: gameState.turnNumber + 1,
      history: [
        ...gameState.history,
        {
          decision: {
            id: choiceId,
            text: choice.text,
            energyCost: 0,
            riskLevel: 0,
            timeRequired: 1
          },
          consequences: [choice.outcome.principle],
          metricsChange: choice.outcome.metricsChange,
          immediateEffect: choice.outcome.immediate,
          decisionQuality: choice.outcome.quality,
          survivalPrincipleAlignment: choice.outcome.educationalFeedback
        }
      ]
    };

    setGameState(updatedState);
    setCompletedTutorials(prev => new Set([...prev, currentTutorialScenario.id]));
    setCurrentTutorialScenario(null);
  };

  const handleDismissTutorial = () => {
    if (!currentTutorialScenario) return;
    setCompletedTutorials(prev => new Set([...prev, currentTutorialScenario.id]));
    setCurrentTutorialScenario(null);
  };

  // Show loadout screen first
  if (!loadoutComplete) {
    // Wait for scenario to be generated before showing loadout
    if (!scenario) {
      return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Preparing mission briefing...</p>
          </div>
        </div>
      );
    }
    return <LoadoutScreen scenario={scenario} onComplete={handleLoadoutComplete} />;
  }

  // Error state if game failed to load
  if (gameLoadError) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Game</h2>
          <p className="text-gray-400 mb-6">{gameLoadError}</p>
          <button
            onClick={() => {
              setGameLoadError(null);
              setLoadoutComplete(false);
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state while game initializes
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating survival scenario...</p>
        </div>
      </div>
    );
  }

  if (gameState.status === 'ended' && showOutcome) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 relative">
        <DynamicEnvironmentBackground
          environment={gameState.currentEnvironment}
          timeOfDay={gameState.currentTimeOfDay}
          weather={gameState.scenario.weather}
          temperature={gameState.scenario.temperature}
          windSpeed={gameState.scenario.windSpeed}
          metrics={gameState.metrics}
          turnNumber={gameState.turnNumber}
        />
        <div className="max-w-3xl mx-auto py-8 relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-light text-gray-100 mb-2">Survival</h1>
            <p className="text-gray-500">A decision game</p>
          </div>
          <GameOutcome state={gameState} onNewGame={handleNewGame} />
        </div>
      </div>
    );
  }

  // Show failure explanation modal first if player died
  if (showFailureExplanation && gameState) {
    return (
      <FailureExplanationModal
        state={gameState}
        causalityChain={gameState.causalityChain}
        onClose={handleCloseFailureExplanation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative">
      <DynamicEnvironmentBackground
        environment={gameState.currentEnvironment}
        timeOfDay={gameState.currentTimeOfDay}
        weather={gameState.scenario.weather}
        temperature={gameState.scenario.temperature}
        windSpeed={gameState.scenario.windSpeed}
        metrics={gameState.metrics}
        turnNumber={gameState.turnNumber}
      />

      {/* Danger Vignette - Visual warning effect */}
      <DangerVignette stats={getPlayerStats(gameState)} />

      {/* Critical Stats Alert - Non-dismissible banner for critical conditions */}
      <CriticalStatsAlert metrics={gameState.metrics} />

      {/* Action History Log - Fixed at bottom - Hidden on mobile */}
      <div className="hidden md:block">
        <ActionHistory history={gameState.history} maxVisible={5} />
      </div>

      {/* Inventory Tray - Shows equipped items */}
      <InventoryTray />

      {/* Icon Legend Help Button - Always visible */}
      <button
        onClick={() => setShowIconLegend(true)}
        className="fixed top-4 right-4 lg:top-auto lg:bottom-4 lg:right-4 z-40 bg-blue-600/90 hover:bg-blue-700 backdrop-blur-md border-2 border-blue-500 rounded-full shadow-2xl p-3 active:scale-95 transition-all hover:scale-110"
        aria-label="Show icon legend"
        title="Icon Legend - Learn what all icons mean"
      >
        <HelpCircle className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Status Button */}
      <button
        onClick={handleStatusButtonClick}
        className={`lg:hidden fixed top-4 right-16 z-40 bg-gray-900/95 backdrop-blur-md border-2 border-gray-700 rounded-xl shadow-2xl p-3 active:scale-95 transition-transform ${showPulse ? 'animate-pulse' : ''}`}
        aria-label="View status"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚕️</span>
          <div className="text-left">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Status</div>
            <div className="flex gap-1 text-xs">
              <span className="text-blue-400">💧{Math.round(gameState.metrics.hydration)}</span>
              <span className="text-green-400">⚡{Math.round(gameState.metrics.energy)}</span>
            </div>
          </div>
        </div>
      </button>

      {/* Mobile Status Drawer */}
      {showMobileStatus && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop with fallback */}
          <div
            className="absolute inset-0 backdrop-blur-fallback animate-fadeIn"
            onClick={() => setShowMobileStatus(false)}
          />

          {/* Drawer with swipe support */}
          <div
            className="relative w-full max-h-[85vh] bg-gray-950 border-t-2 border-gray-700 rounded-t-2xl overflow-y-auto animate-slideUp"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <span>⚕️</span>
                Survival Status
              </h2>
              <button
                onClick={() => setShowMobileStatus(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                aria-label="Close status"
              >
                <CloudSnow className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              <ObjectiveDisplay gameState={gameState} />
              <div className="mt-4">
                <InformationDashboard gameState={gameState} compact={true} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Scenario Modal */}
      {currentTutorialScenario && (
        <TutorialScenarioModal
          scenario={currentTutorialScenario}
          onChoice={handleTutorialChoice}
          onDismiss={handleDismissTutorial}
        />
      )}

      {/* Principle Unlock Modal - REMOVED for UX improvement
          Redundant with debrief card, was causing modal fatigue */}

      {/* Notification removed to reduce modal cascade */}

      {/* Survival Debrief Card - Shows after decision */}
      {currentDebrief && (
        <SurvivalDebriefCard
          principle={currentDebrief.principle}
          category={currentDebrief.category}
          onDismiss={() => setCurrentDebrief(null)}
        />
      )}

      {/* Main content area */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-8 relative z-10 pb-32 md:pb-8">
        <div className="mb-4 md:mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CloudSnow className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            <h1 className="text-2xl md:text-3xl font-light text-gray-100">Survival</h1>
          </div>
          <p className="text-sm md:text-base text-gray-500">Think. Endure. Decide.</p>
        </div>

        {/* Scenario Hero Image - Only on first turn */}
        {gameState.turnNumber === 1 && (
          <div className="mb-6 rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
            <ScenarioHeroImage
              scenario={gameState.scenario}
              className="h-48 md:h-64"
              showOverlay={true}
            />
          </div>
        )}

        <div className="space-y-4 md:space-y-6">
          <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
            <div className="lg:col-span-3">
              {gameState.turnNumber === 1 ? (
                <>
                  <div className="p-4 md:p-8 bg-gray-900 rounded-lg border border-gray-800">
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-xl md:columns-2 gap-8">
                        {generateBriefing(gameState.scenario)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-950/50 border border-blue-700/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <span className="text-xl md:text-2xl">🎯</span>
                      <h4 className="text-sm md:text-base font-semibold text-white">Survival Priorities</h4>
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      {getEnvironmentTips(gameState.scenario.environment).slice(0, 3).map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 md:gap-3">
                          <span className="text-blue-300 text-xs md:text-sm font-mono mt-0.5 flex-shrink-0">
                            {i + 1}.
                          </span>
                          <span className="text-xs md:text-sm text-white leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-blue-700/30">
                      <p className="text-[10px] md:text-xs text-gray-300 italic">
                        These principles are based on the SAS Survival Handbook
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 md:p-8 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                    {generateConciseBrief(
                      gameState.scenario,
                      gameState.metrics,
                      gameState.currentTimeOfDay,
                      gameState.history.length > 0 ? gameState.history[gameState.history.length - 1] : undefined
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-4 space-y-4">
                <ObjectiveDisplay gameState={gameState} />
                <InformationDashboard gameState={gameState} />
              </div>
            </div>
          </div>

          {recentOutcome && gameState.history.length > 0 && (
            <div className="relative">
              {lastDecisionId && (
                <div className="absolute inset-0 pointer-events-none opacity-10 hidden md:block">
                  <DecisionIllustration
                    decisionId={lastDecisionId}
                    environment={gameState.currentEnvironment}
                  />
                </div>
              )}
              <div className="relative z-10">
                {gameState.history[gameState.history.length - 1].explanation ? (
                  <ConsequenceExplanationPanel
                    explanation={gameState.history[gameState.history.length - 1].explanation!}
                    metricsChange={gameState.history[gameState.history.length - 1].metricsChange}
                  />
                ) : (
                  <div className="p-4 md:p-6 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <p className="text-gray-300 leading-relaxed text-sm md:text-lg">{recentOutcome}</p>
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-blue-800 space-y-1">
                      {gameState.history[gameState.history.length - 1].consequences.map(
                        (consequence, index) => (
                          <p key={index} className="text-xs md:text-base text-gray-400">
                            {consequence}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl text-gray-400">What do you do?</h2>
              <div className="text-sm md:text-base text-gray-600 mt-1">Turn {gameState.turnNumber}</div>
            </div>
            <DecisionList
              decisions={decisions}
              onSelect={handleDecision}
              disabled={gameState.status !== 'active'}
              gameState={gameState}
            />
          </div>
        </div>
      </div>

      {/* Icon Legend Modal */}
      <IconLegendModal
        isOpen={showIconLegend}
        onClose={() => setShowIconLegend(false)}
      />
    </div>
  );
}
