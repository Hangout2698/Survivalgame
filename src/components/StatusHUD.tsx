import { useState, useEffect } from 'react';
import { Thermometer, Droplet, Battery, Heart } from 'lucide-react';

export interface PlayerStats {
  bodyHeat: number;
  hydration: number;
  energy: number;
  morale: number;
}

interface StatusHUDProps {
  stats: PlayerStats;
  onGameOver?: (reason: string) => void;
}

export function StatusHUD({ stats, onGameOver }: StatusHUDProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [criticalStat, setCriticalStat] = useState<string | null>(null);

  useEffect(() => {
    // Check for game over conditions
    if (stats.bodyHeat <= 0) {
      onGameOver?.('You succumbed to hypothermia');
      return;
    }
    if (stats.hydration <= 0) {
      onGameOver?.('You died from severe dehydration');
      return;
    }
    if (stats.energy <= 0) {
      onGameOver?.('You collapsed from exhaustion');
      return;
    }
    if (stats.morale <= 0) {
      onGameOver?.('You gave up hope and perished');
      return;
    }

    // Show warning for low stats
    const lowStats = Object.entries(stats).filter(([_, value]) => value > 0 && value < 20);
    if (lowStats.length > 0) {
      setShowWarning(true);
      setCriticalStat(lowStats[0][0]);
    } else {
      setShowWarning(false);
      setCriticalStat(null);
    }
  }, [stats, onGameOver]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-4 gap-4">
          <StatBar
            icon={<Thermometer className="w-5 h-5" />}
            label="Body Heat"
            value={stats.bodyHeat}
            max={100}
            color={getStatColor(stats.bodyHeat)}
          />
          <StatBar
            icon={<Droplet className="w-5 h-5" />}
            label="Hydration"
            value={stats.hydration}
            max={100}
            color={getStatColor(stats.hydration)}
          />
          <StatBar
            icon={<Battery className="w-5 h-5" />}
            label="Energy"
            value={stats.energy}
            max={100}
            color={getStatColor(stats.energy)}
          />
          <StatBar
            icon={<Heart className="w-5 h-5" />}
            label="Morale"
            value={stats.morale}
            max={100}
            color={getStatColor(stats.morale)}
          />
        </div>

        {showWarning && criticalStat && (
          <div className="mt-2 px-3 py-1.5 bg-red-900/30 border border-red-700/50 rounded text-center">
            <span className="text-red-300 text-sm font-medium animate-pulse">
              ⚠️ Critical: {formatStatName(criticalStat)} is dangerously low!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  color: string;
}

function StatBar({ icon, label, value, max, color }: StatBarProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const displayValue = Math.max(0, Math.round(value));

  return (
    <div className="flex items-center gap-3">
      <div className={`${color.split(' ')[1]} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-300 truncate">{label}</span>
          <span className={`text-sm font-mono font-bold ${color.split(' ')[1]}`}>
            {displayValue}
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${color.split(' ')[0]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function getStatColor(value: number): string {
  if (value > 50) return 'bg-green-600 text-green-400';
  if (value >= 20) return 'bg-yellow-600 text-yellow-400';
  return 'bg-red-600 text-red-400';
}

function formatStatName(stat: string): string {
  return stat
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
