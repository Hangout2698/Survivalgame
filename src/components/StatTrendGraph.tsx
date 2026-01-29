import { DecisionOutcome, PlayerMetrics } from '../types/game';

interface StatTrendGraphProps {
  history: DecisionOutcome[];
  metricKey: keyof PlayerMetrics;
  metricLabel: string;
  initialValue: number;
  metricRange: { min: number; max: number };
  isInverse?: boolean;
}

interface TrendDataPoint {
  turn: number;
  value: number;
  wasPositiveChange: boolean;
}

/**
 * SVG line chart showing metric evolution over turns
 * No external charting library - custom SVG implementation
 */
export function StatTrendGraph({
  history,
  metricKey,
  metricLabel,
  initialValue,
  metricRange
}: StatTrendGraphProps) {
  // Extract trend data from history
  const trendData = extractTrendData(history, metricKey, initialValue, metricRange);

  // No data to display
  if (trendData.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded p-4">
        <div className="text-sm font-medium text-gray-300 mb-2">{metricLabel} History</div>
        <div className="text-sm text-gray-500">No history data available yet.</div>
      </div>
    );
  }

  // SVG dimensions and padding
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  // Scaling functions
  const scaleX = (turn: number) =>
    padding.left + ((turn - 1) / Math.max(trendData.length - 1, 1)) * (width - padding.left - padding.right);

  const scaleY = (value: number) =>
    padding.top + (1 - ((value - metricRange.min) / (metricRange.max - metricRange.min))) * (height - padding.top - padding.bottom);

  // Generate SVG path
  const pathData = trendData.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${scaleX(d.turn)},${scaleY(d.value)}`
  ).join(' ');

  // Critical threshold (25% for most metrics)
  const criticalThreshold = metricRange.min + (metricRange.max - metricRange.min) * 0.25;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4">
      <div className="text-sm font-medium text-gray-300 mb-2">{metricLabel} History</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Critical threshold line (25%) */}
        <line
          x1={padding.left}
          y1={scaleY(criticalThreshold)}
          x2={width - padding.right}
          y2={scaleY(criticalThreshold)}
          stroke="#EF4444"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.6"
        />
        <text
          x={width - padding.right + 5}
          y={scaleY(criticalThreshold) + 4}
          className="text-xs fill-red-400"
          fontSize="10"
        >
          Critical
        </text>

        {/* Warning threshold line (50%) */}
        <line
          x1={padding.left}
          y1={scaleY(metricRange.min + (metricRange.max - metricRange.min) * 0.5)}
          x2={width - padding.right}
          y2={scaleY(metricRange.min + (metricRange.max - metricRange.min) * 0.5)}
          stroke="#F59E0B"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.4"
        />

        {/* Trend line */}
        <path
          d={pathData}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2"
        />

        {/* Data points */}
        {trendData.map((d, i) => (
          <g key={i}>
            <circle
              cx={scaleX(d.turn)}
              cy={scaleY(d.value)}
              r={i === trendData.length - 1 ? 6 : 3}
              fill={d.wasPositiveChange ? '#22C55E' : '#EF4444'}
              stroke={i === trendData.length - 1 ? '#ffffff' : 'none'}
              strokeWidth={i === trendData.length - 1 ? 2 : 0}
            />
            {/* Show value on hover - use title for accessibility */}
            <title>
              Turn {d.turn}: {Math.round(d.value)}
            </title>
          </g>
        ))}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#4B5563"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#4B5563"
          strokeWidth="1"
        />

        {/* Y-axis labels */}
        <text x={padding.left - 30} y={padding.top + 4} className="text-xs fill-gray-500" fontSize="10">
          {metricRange.max}
        </text>
        <text x={padding.left - 30} y={scaleY((metricRange.max + metricRange.min) / 2) + 4} className="text-xs fill-gray-500" fontSize="10">
          {Math.round((metricRange.max + metricRange.min) / 2)}
        </text>
        <text x={padding.left - 30} y={height - padding.bottom + 4} className="text-xs fill-gray-500" fontSize="10">
          {metricRange.min}
        </text>

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 5}
          className="text-xs fill-gray-500"
          fontSize="10"
          textAnchor="middle"
        >
          Turn
        </text>
      </svg>
    </div>
  );
}

/**
 * Extract trend data from decision history
 */
function extractTrendData(
  history: DecisionOutcome[],
  metricKey: keyof PlayerMetrics,
  initialValue: number,
  metricRange: { min: number; max: number }
): TrendDataPoint[] {
  let currentValue = initialValue;
  const data: TrendDataPoint[] = [{ turn: 1, value: initialValue, wasPositiveChange: false }];

  history.forEach((outcome, idx) => {
    const change = outcome.metricsChange[metricKey] || 0;
    currentValue += change;

    // Clamp to valid range
    currentValue = Math.max(metricRange.min, Math.min(metricRange.max, currentValue));

    data.push({
      turn: idx + 2, // Turn 1 is initial, Turn 2 is after first decision
      value: currentValue,
      wasPositiveChange: change > 0
    });
  });

  return data;
}
