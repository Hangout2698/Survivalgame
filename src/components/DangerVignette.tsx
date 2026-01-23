import { useMemo } from 'react';
import type { PlayerStats } from './StatusHUD';

interface DangerVignetteProps {
  stats: PlayerStats;
}

export function DangerVignette({ stats }: DangerVignetteProps) {
  // Calculate danger level based on lowest stat
  const dangerLevel = useMemo(() => {
    const lowestStat = Math.min(
      stats.bodyHeat,
      stats.hydration,
      stats.energy,
      stats.morale
    );

    // No vignette above 25%
    if (lowestStat > 25) return 0;

    // Map 0-25 to 0-100 danger level
    return Math.round(((25 - lowestStat) / 25) * 100);
  }, [stats]);

  // Calculate opacity (0 to 0.7 max for readability)
  const opacity = (dangerLevel / 100) * 0.7;

  // Determine vignette color based on which stat is lowest
  const criticalStat = useMemo(() => {
    const statValues = [
      { name: 'cold', value: stats.bodyHeat, color: 'rgba(59, 130, 246, ' }, // blue for cold
      { name: 'dehydration', value: stats.hydration, color: 'rgba(239, 68, 68, ' }, // red
      { name: 'exhaustion', value: stats.energy, color: 'rgba(234, 88, 12, ' }, // orange
      { name: 'despair', value: stats.morale, color: 'rgba(168, 85, 247, ' } // purple
    ];

    return statValues.reduce((min, stat) => stat.value < min.value ? stat : min);
  }, [stats]);

  if (dangerLevel === 0) return null;

  return (
    <>
      {/* Vignette Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-1000"
        style={{
          opacity,
          background: `radial-gradient(circle at center, transparent 0%, transparent 40%, ${criticalStat.color}${opacity}) 100%)`
        }}
      />

      {/* Pulsing Border Effect for Critical States */}
      {dangerLevel > 60 && (
        <div
          className="fixed inset-0 pointer-events-none z-40 animate-pulse"
          style={{
            opacity: opacity * 0.5,
            boxShadow: `inset 0 0 100px 20px ${criticalStat.color}0.8)`
          }}
        />
      )}

      {/* Screen shake effect for extreme danger */}
      {dangerLevel > 80 && (
        <style>{`
          @keyframes danger-shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
          }
          body {
            animation: danger-shake 0.5s infinite;
          }
        `}</style>
      )}
    </>
  );
}
