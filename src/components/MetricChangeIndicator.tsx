interface MetricChangeIndicatorProps {
  change: number;
  isInverse?: boolean;
}

/**
 * Displays a floating badge showing the numeric change in a metric (+5, -12)
 * Automatically fades out after 2 seconds
 */
export function MetricChangeIndicator({ change, isInverse = false }: MetricChangeIndicatorProps) {
  // For inverse metrics (injury, risk), a decrease is positive
  const displayChange = isInverse ? -change : change;
  const isPositive = displayChange > 0;

  // Don't render if no change
  if (Math.abs(displayChange) < 0.1) return null;

  return (
    <div
      className={`
        absolute -top-6 right-0 text-xs font-bold
        animate-fade-up-out pointer-events-none
        ${isPositive ? 'text-green-400' : 'text-red-400'}
      `}
    >
      {isPositive ? '+' : ''}{Math.round(displayChange)}
    </div>
  );
}
