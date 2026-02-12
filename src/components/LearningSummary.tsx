import { Brain, TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import type { PrincipleCategory } from '../engine/survivalPrinciplesService';
import {
  getCurrentSessionPrinciples,
  getKnowledgeStrengths,
  getTotalStats
} from '../engine/knowledgeTracker';

interface LearningSummaryProps {
  onClose?: () => void;
}

const CATEGORY_DISPLAY: Record<PrincipleCategory, { name: string; emoji: string; color: string }> = {
  shelter: { name: 'Shelter', emoji: '⛺', color: 'amber' },
  water: { name: 'Water', emoji: '💧', color: 'blue' },
  fire: { name: 'Fire', emoji: '🔥', color: 'red' },
  food: { name: 'Food', emoji: '🍖', color: 'green' },
  navigation: { name: 'Navigation', emoji: '🧭', color: 'indigo' },
  signaling: { name: 'Signaling', emoji: '🚨', color: 'yellow' },
  firstAid: { name: 'First Aid', emoji: '⚕️', color: 'pink' },
  priorities: { name: 'Priorities', emoji: '⭐', color: 'purple' },
  psychology: { name: 'Psychology', emoji: '🧠', color: 'teal' },
  weather: { name: 'Weather', emoji: '⛅', color: 'gray' }
};

export function LearningSummary({ onClose }: LearningSummaryProps) {
  const sessionPrinciples = getCurrentSessionPrinciples();
  const { strongest, weakest } = getKnowledgeStrengths();
  const stats = getTotalStats();

  return (
    <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-100">Session Learning Summary</h3>
          <p className="text-sm text-gray-300">What you learned from this survival scenario</p>
        </div>
      </div>

      {/* Principles Learned This Session */}
      <div>
        <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <span className="text-lg">📚</span>
          Principles Learned This Session
        </h4>
        {sessionPrinciples.length > 0 ? (
          <div className="space-y-2">
            {sessionPrinciples.map((principle, idx) => (
              <div key={idx} className="p-3 bg-blue-900/20 border border-blue-800/40 rounded-lg">
                <p className="text-sm text-gray-300 leading-relaxed">{principle}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-300 italic">No new principles learned this session</p>
        )}
      </div>

      {/* Knowledge Strengths */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strongest Areas */}
        <div className="p-4 bg-green-900/20 border border-green-800/40 rounded-lg">
          <h4 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Strongest Knowledge
          </h4>
          <div className="space-y-2">
            {strongest.slice(0, 3).map((item, idx) => {
              const display = CATEGORY_DISPLAY[item.category];
              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span>{display.emoji}</span>
                    {display.name}
                  </span>
                  <span className="text-green-400 font-mono font-bold">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weakest Areas */}
        <div className="p-4 bg-orange-900/20 border border-orange-800/40 rounded-lg">
          <h4 className="text-sm font-bold text-orange-300 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Areas to Improve
          </h4>
          <div className="space-y-2">
            {weakest.slice(0, 3).map((item, idx) => {
              const display = CATEGORY_DISPLAY[item.category];
              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span>{display.emoji}</span>
                    {display.name}
                  </span>
                  <span className="text-orange-400 font-mono font-bold">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="p-4 bg-purple-900/20 border-2 border-purple-600/50 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <Award className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm font-bold text-purple-300">Overall Progress</h4>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-300 text-xs mb-1">Total Principles</div>
            <div className="text-2xl font-bold text-purple-300">{stats.totalPrinciples}</div>
          </div>
          <div>
            <div className="text-gray-300 text-xs mb-1">Sessions Played</div>
            <div className="text-2xl font-bold text-purple-300">{stats.totalSessions}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-300 text-xs mb-1">Survival Rate</div>
            <div className="text-2xl font-bold text-purple-300">{stats.survivalRate.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      {weakest.length > 0 && weakest[0].count < strongest[0]?.count * 0.5 && (
        <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-blue-900/30 border-2 border-indigo-600/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-indigo-300 mb-2">Recommended Focus</h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                Your knowledge of <span className="font-semibold text-indigo-300">
                  {CATEGORY_DISPLAY[weakest[0].category].name}
                </span> could use improvement. Try scenarios that challenge these skills to become a more well-rounded survivor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Close Button (if callback provided) */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 active:scale-95 rounded-lg text-sm text-gray-100 font-medium transition-all"
        >
          Continue
        </button>
      )}
    </div>
  );
}
