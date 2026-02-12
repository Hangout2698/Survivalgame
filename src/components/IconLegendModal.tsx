import { X, AlertTriangle, Thermometer } from 'lucide-react';

interface IconLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IconEntry {
  icon: string | JSX.Element;
  label: string;
  description: string;
  category: string;
}

const iconEntries: IconEntry[] = [
  // Energy & Resources
  {
    icon: '⚡',
    label: 'Energy',
    description: 'How much stamina this action costs or restores. Negative values drain energy, positive values restore it.',
    category: 'Resources'
  },
  {
    icon: '💧',
    label: 'Hydration',
    description: 'Water consumption or restoration. Low hydration severely impacts your survival chances.',
    category: 'Resources'
  },
  {
    icon: <Thermometer className="w-5 h-5" />,
    label: 'Temperature',
    description: 'How this action affects your body temperature in degrees Celsius. Maintain 36-38°C for safety.',
    category: 'Resources'
  },

  // Time & Difficulty
  {
    icon: '⏱️',
    label: 'Time',
    description: 'How many hours this action takes. Time advances the game and affects environmental conditions.',
    category: 'Time & Difficulty'
  },
  {
    icon: '◆',
    label: 'Light Difficulty',
    description: 'Short action with low energy cost (typically 1 hour, -20 energy or less).',
    category: 'Time & Difficulty'
  },
  {
    icon: '◆◆',
    label: 'Moderate Difficulty',
    description: 'Medium action with moderate energy cost (typically 2-3 hours, -45 energy).',
    category: 'Time & Difficulty'
  },
  {
    icon: '◆◆◆',
    label: 'Extreme Difficulty',
    description: 'Long action with high energy cost (3+ hours, -54+ energy). Use when well-rested.',
    category: 'Time & Difficulty'
  },

  // Risk & Success
  {
    icon: '🎯',
    label: 'Success Rate',
    description: 'Percentage chance of success. Green (>70%) = safe, Yellow (50-70%) = risky, Red (<50%) = dangerous.',
    category: 'Risk & Success'
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Risk',
    description: 'Risk level from 1-10. Higher numbers indicate more dangerous actions with potential for injury.',
    category: 'Risk & Success'
  },
  {
    icon: '⚠️',
    label: 'RISKY Warning',
    description: 'Appears when success rate is below 50%. These actions are very dangerous - have a backup plan.',
    category: 'Risk & Success'
  },

  // Shelter & Protection
  {
    icon: '⛺',
    label: 'Shelter',
    description: 'Shelter quality affects protection from weather, temperature regulation, and rest effectiveness.',
    category: 'Shelter & Protection'
  },
  {
    icon: '🔥',
    label: 'Fire',
    description: 'Fire provides warmth, morale boost, water purification, and signaling capability.',
    category: 'Shelter & Protection'
  },
  {
    icon: '🌡️',
    label: 'Heat/Cold',
    description: 'Temperature-related indicators. Blue = cold threat, Red = heat threat.',
    category: 'Shelter & Protection'
  },

  // Navigation & Signaling
  {
    icon: '🧭',
    label: 'Navigation',
    description: 'Compass and direction-finding. Higher navigation increases chance of finding safety.',
    category: 'Navigation & Signaling'
  },
  {
    icon: '🚨',
    label: 'Signaling',
    description: 'Signal effectiveness for rescue. 3+ successful signals with 60+ effectiveness = rescue possible.',
    category: 'Navigation & Signaling'
  },
  {
    icon: '📡',
    label: 'Radio/Whistle',
    description: 'Communication devices for signaling rescue teams. More effective than visual signals in poor weather.',
    category: 'Navigation & Signaling'
  },

  // Health & Survival
  {
    icon: '⚕️',
    label: 'First Aid',
    description: 'Medical treatment and injury management. Untreated injuries worsen over time.',
    category: 'Health & Survival'
  },
  {
    icon: '❤️',
    label: 'Morale',
    description: 'Mental state affects decision quality and physical performance. Keep morale high for better outcomes.',
    category: 'Health & Survival'
  },
  {
    icon: '🍖',
    label: 'Food',
    description: 'Food consumption or foraging. While not immediately critical, hunger affects energy and morale.',
    category: 'Health & Survival'
  },

  // Equipment
  {
    icon: '🎒',
    label: 'Equipment',
    description: 'Items carried in your backpack. Each item has limited uses or passive benefits.',
    category: 'Equipment'
  },
  {
    icon: '🔪',
    label: 'Tools',
    description: 'Knives, multitools, and other implements. Enable shelter building and food preparation.',
    category: 'Equipment'
  },
  {
    icon: '🧰',
    label: 'Containers',
    description: 'Water bottles, canteens, and storage. Containers stay with you even after contents are consumed.',
    category: 'Equipment'
  },

  // Environmental
  {
    icon: '💨',
    label: 'Wind',
    description: 'Wind speed affects heat loss (wind chill), shelter integrity, and signaling effectiveness.',
    category: 'Environmental'
  },
  {
    icon: '🌧️',
    label: 'Weather',
    description: 'Rain, snow, storm, or clear conditions. Weather affects visibility, temperature, and action success.',
    category: 'Environmental'
  },
  {
    icon: '🌙',
    label: 'Time of Day',
    description: 'Dawn, day, dusk, or night. Visibility and temperature vary throughout the day.',
    category: 'Environmental'
  },

  // Indicators
  {
    icon: '✓',
    label: 'Good Decision',
    description: 'Green checkmark indicates this decision aligned with survival principles.',
    category: 'Indicators'
  },
  {
    icon: '✗',
    label: 'Poor Decision',
    description: 'Red X indicates this decision violated survival principles or was dangerous.',
    category: 'Indicators'
  },
  {
    icon: '🎓',
    label: 'Learning',
    description: 'Educational content and survival principles. The game teaches real wilderness survival skills.',
    category: 'Indicators'
  }
];

export function IconLegendModal({ isOpen, onClose }: IconLegendModalProps) {
  if (!isOpen) return null;

  // Group icons by category
  const categories = Array.from(new Set(iconEntries.map(e => e.category)));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">ℹ️</span>
              Icon Legend
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Reference guide for all game icons and indicators
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close legend"
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
                  <span className="text-xl">📌</span>
                  {category}
                </h3>
                <div className="grid gap-3">
                  {iconEntries
                    .filter(e => e.category === category)
                    .map((entry, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className="flex-shrink-0 w-12 h-12 bg-gray-900 border border-gray-600 rounded-lg flex items-center justify-center text-2xl">
                            {typeof entry.icon === 'string' ? (
                              entry.icon
                            ) : (
                              <div className="text-blue-300">{entry.icon}</div>
                            )}
                          </div>

                          {/* Description */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-white mb-1">
                              {entry.label}
                            </h4>
                            <p className="text-sm text-gray-200 leading-relaxed">
                              {entry.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer tip */}
          <div className="mt-8 p-4 bg-blue-950/30 border border-blue-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Pro Tip
                </h4>
                <p className="text-sm text-gray-200 leading-relaxed">
                  Hover over icons in the game for quick tooltips. Use this legend as a comprehensive reference when learning the game mechanics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 px-6 py-4 bg-gray-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">
              Based on real wilderness survival principles
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
