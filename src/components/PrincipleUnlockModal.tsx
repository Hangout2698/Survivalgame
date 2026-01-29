import { X, BookOpen, Award } from 'lucide-react';
import { getCategoryIcon } from '../engine/principleProgressService';
import type { PrincipleCategory } from '../engine/survivalPrinciplesService';

interface PrincipleUnlockModalProps {
  principle: string;
  category: PrincipleCategory;
  onClose: () => void;
}

export function PrincipleUnlockModal({ principle, category, onClose }: PrincipleUnlockModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-green-500 rounded-lg shadow-2xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-green-400" />
              <h2 className="text-2xl font-bold text-green-400">Principle Discovered!</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{getCategoryIcon(category)}</span>
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              {category}
            </span>
          </div>

          {/* Principle Text */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-200 leading-relaxed">
                {principle}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-400 italic text-center mb-4">
            Knowledge gained through experience increases survival probability
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Continue Surviving
          </button>
        </div>
      </div>
    </div>
  );
}
