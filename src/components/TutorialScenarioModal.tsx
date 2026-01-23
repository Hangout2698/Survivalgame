import { useState } from 'react';
import type { TutorialScenario } from '../data/tutorialScenarios';
import { AlertTriangle, BookOpen, Clock, X } from 'lucide-react';

interface TutorialScenarioModalProps {
  scenario: TutorialScenario;
  onChoice: (choiceId: string) => void;
  onDismiss: () => void;
}

export function TutorialScenarioModal({ scenario, onChoice, onDismiss }: TutorialScenarioModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);

  const handleChoiceSelect = (choiceId: string) => {
    const choice = scenario.choices.find(c => c.id === choiceId);
    if (!choice) return;

    setSelectedChoice(choiceId);
    setShowOutcome(true);
  };

  const handleContinue = () => {
    if (selectedChoice) {
      onChoice(selectedChoice);
    }
  };

  const selectedChoiceData = scenario.choices.find(c => c.id === selectedChoice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-950 to-black border-2 border-orange-600/50 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-900/90 to-red-900/90 backdrop-blur-md px-6 py-4 border-b-2 border-orange-600/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-7 h-7 text-orange-400 animate-pulse" />
                <h2 className="text-2xl font-bold text-orange-100">{scenario.title}</h2>
              </div>
              <p className="text-sm text-orange-200/80 italic">
                Teaching Principle: <span className="font-semibold">{scenario.concept}</span>
              </p>
            </div>
            {!showOutcome && (
              <button
                onClick={onDismiss}
                className="p-2 hover:bg-orange-800/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-orange-300" />
              </button>
            )}
          </div>

          {scenario.timeLimit && !showOutcome && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-900/40 border border-red-700/50 rounded-lg">
              <Clock className="w-4 h-4 text-red-300" />
              <span className="text-sm text-red-200 font-medium">
                Time Pressure: {scenario.timeLimit} minutes until conditions worsen
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {!showOutcome ? (
            <>
              {/* Scenario Setup */}
              <div className="mb-6 p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  The Situation
                </h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {scenario.setup}
                </p>
              </div>

              {/* Choice Cards */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Your Decision:</h3>
                <div className="grid gap-4">
                  {scenario.choices.map((choice, index) => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoiceSelect(choice.id)}
                      className={`
                        text-left p-6 rounded-xl border-2 transition-all duration-300
                        ${selectedChoice === choice.id
                          ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-gray-800/30 border-gray-700 hover:border-gray-600 hover:shadow-lg'
                        }
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg
                          ${selectedChoice === choice.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-300'
                          }
                        `}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-100 mb-2">{choice.text}</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">{choice.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Educational Hook (Preview) */}
              <div className="p-5 bg-blue-900/20 border border-blue-800/40 rounded-lg">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-2">Why This Matters:</h4>
                    <p className="text-sm text-gray-300 leading-relaxed italic">
                      {scenario.educationalHook}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : selectedChoiceData && (
            <>
              {/* Outcome Display */}
              <div className={`
                mb-6 p-6 rounded-xl border-2
                ${selectedChoiceData.outcome.quality === 'excellent'
                  ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-600'
                  : selectedChoiceData.outcome.quality === 'good'
                  ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-600'
                  : selectedChoiceData.outcome.quality === 'poor'
                  ? 'bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-600'
                  : 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-600'
                }
              `}>
                <h3 className={`
                  text-2xl font-bold mb-4 flex items-center gap-3
                  ${selectedChoiceData.outcome.quality === 'excellent' ? 'text-green-400' :
                    selectedChoiceData.outcome.quality === 'good' ? 'text-blue-400' :
                    selectedChoiceData.outcome.quality === 'poor' ? 'text-orange-400' :
                    'text-red-400'
                  }
                `}>
                  {selectedChoiceData.outcome.quality === 'excellent' && '✅'}
                  {selectedChoiceData.outcome.quality === 'good' && '👍'}
                  {selectedChoiceData.outcome.quality === 'poor' && '⚠️'}
                  {selectedChoiceData.outcome.quality === 'critical-error' && '❌'}
                  {' '}What Happened
                </h3>
                <p className="text-gray-200 leading-relaxed mb-4 text-lg">
                  {selectedChoiceData.outcome.immediate}
                </p>

                {/* Metric Changes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {Object.entries(selectedChoiceData.outcome.metricsChange).map(([key, value]) => {
                    if (!value) return null;
                    const isPositive = ['energy', 'hydration', 'bodyTemperature', 'morale', 'shelter'].includes(key)
                      ? value > 0
                      : value < 0;

                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg ${
                          isPositive ? 'bg-green-900/40' : 'bg-red-900/40'
                        }`}
                      >
                        <div className="text-xs text-gray-400 capitalize">{formatMetricName(key)}</div>
                        <div className={`text-lg font-mono font-bold ${
                          isPositive ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {value > 0 ? '+' : ''}{value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Educational Feedback */}
              <div className="mb-6 p-6 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-2 border-purple-600/50 rounded-xl">
                <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  The Science
                </h3>
                <p className="text-gray-200 leading-relaxed text-base mb-4">
                  {selectedChoiceData.outcome.educationalFeedback}
                </p>
                <div className="pt-3 border-t border-purple-700/30">
                  <p className="text-sm text-purple-200 italic font-medium">
                    💡 Key Principle: {selectedChoiceData.outcome.principle}
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg"
              >
                Continue Your Survival Journey →
              </button>
            </>
          )}
        </div>
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
    cumulativeRisk: 'Risk'
  };
  return names[key] || key;
}
