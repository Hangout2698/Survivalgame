import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import type { PrincipleCategory } from '../engine/survivalPrinciplesService';
import { recordPrincipleView, getPrincipleViewCount } from '../engine/knowledgeTracker';

interface SurvivalDebriefCardProps {
  principle: string;
  category: PrincipleCategory;
  onDismiss: () => void;
}

const CATEGORY_COLORS: Record<PrincipleCategory, { bg: string; border: string; text: string; emoji: string }> = {
  shelter: { bg: 'from-amber-900/40 to-orange-900/40', border: 'border-amber-600', text: 'text-amber-300', emoji: '⛺' },
  water: { bg: 'from-blue-900/40 to-cyan-900/40', border: 'border-blue-500', text: 'text-blue-300', emoji: '💧' },
  fire: { bg: 'from-red-900/40 to-orange-900/40', border: 'border-red-500', text: 'text-red-300', emoji: '🔥' },
  food: { bg: 'from-green-900/40 to-emerald-900/40', border: 'border-green-500', text: 'text-green-300', emoji: '🍖' },
  navigation: { bg: 'from-indigo-900/40 to-blue-900/40', border: 'border-indigo-500', text: 'text-indigo-300', emoji: '🧭' },
  signaling: { bg: 'from-yellow-900/40 to-amber-900/40', border: 'border-yellow-500', text: 'text-yellow-300', emoji: '🚨' },
  firstAid: { bg: 'from-pink-900/40 to-red-900/40', border: 'border-pink-500', text: 'text-pink-300', emoji: '⚕️' },
  priorities: { bg: 'from-purple-900/40 to-fuchsia-900/40', border: 'border-purple-500', text: 'text-purple-300', emoji: '⭐' },
  psychology: { bg: 'from-teal-900/40 to-cyan-900/40', border: 'border-teal-500', text: 'text-teal-300', emoji: '🧠' },
  weather: { bg: 'from-gray-900/40 to-slate-900/40', border: 'border-gray-500', text: 'text-gray-300', emoji: '⛅' }
};

const AUTO_DISMISS_THRESHOLD = 1; // Always auto-dismiss (UX improvement)
const AUTO_DISMISS_DELAY = 3000; // 3 seconds (faster for better flow)

export function SurvivalDebriefCard({ principle, category, onDismiss }: SurvivalDebriefCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  const colors = CATEGORY_COLORS[category];

  useEffect(() => {
    // Record that this principle was viewed
    recordPrincipleView(principle, category);
    const count = getPrincipleViewCount(principle);
    setViewCount(count);

    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss if seen 3+ times
    if (count >= AUTO_DISMISS_THRESHOLD) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DELAY);

      return () => clearTimeout(timer);
    }
  }, [principle, category]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for slide-out animation
  };

  // Always auto-dismiss now, but show close button for first viewing
  const shouldShowClose = viewCount === 1;

  return (
    <div
      className={`
        fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:max-w-2xl
        transition-all duration-300 ease-out z-50
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
    >
      <div
        className={`
          relative p-6 md:p-8
          bg-gradient-to-br ${colors.bg}
          border-2 ${colors.border}
          rounded-xl shadow-2xl backdrop-blur-sm
        `}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 ${colors.border} opacity-20 blur-xl rounded-xl`}></div>

        {/* Close button (only if not auto-dismissing) */}
        {shouldShowClose && (
          <button
            onClick={handleDismiss}
            className={`
              absolute top-3 right-3 p-2
              ${colors.text} hover:bg-white/10
              rounded-lg transition-colors
            `}
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className={`
              w-12 h-12 rounded-full
              bg-gradient-to-br from-white/20 to-white/5
              flex items-center justify-center text-2xl
            `}>
              {colors.emoji}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className={`w-5 h-5 ${colors.text}`} />
              <h3 className={`text-sm font-bold uppercase tracking-wide ${colors.text}`}>
                Survival Principle
              </h3>
            </div>

            <div className={`
              inline-block px-3 py-1 mb-3
              bg-black/30 rounded-full
              text-xs font-semibold ${colors.text}
              border ${colors.border}
            `}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </div>
          </div>
        </div>

        {/* Principle Text */}
        <p className="text-gray-100 text-lg md:text-xl leading-relaxed font-medium">
          {principle}
        </p>

        {/* Auto-dismiss indicator - always shown now */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.bg}`}
              style={{
                animation: `shrink ${AUTO_DISMISS_DELAY}ms linear forwards`
              }}
            />
          </div>
          <span>{AUTO_DISMISS_DELAY/1000}s</span>
        </div>

        {/* Tap to dismiss hint (mobile only, first view) */}
        {shouldShowClose && (
          <div className="mt-2 text-center text-xs text-gray-400 md:hidden">
            Tap × to skip
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
