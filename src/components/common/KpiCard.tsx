import React from 'react';

export interface MiniStatItem {
  label: string;
  value: string;
}

interface KpiCardProps {
  title: string;
  metric: string;
  unit?: string;
  badgeText?: string;
  badgeVariant?: 'positive' | 'neutral' | 'critical';
  variant?: 'sparkline' | 'mini-grid' | 'progress' | 'critical' | 'standard';
  sparklineData?: number[];
  progressPct?: number;
  miniStats?: MiniStatItem[];
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  criticalMessage?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  metric,
  unit,
  badgeText,
  badgeVariant = 'positive',
  variant = 'standard',
  sparklineData = [12, 14, 13, 17, 19, 18, 22, 21, 24],
  progressPct = 70,
  miniStats,
  actionButton,
  criticalMessage,
  className = '',
}) => {
  const isCritical = variant === 'critical';

  // Generate SVG path for sparkline
  const sparklinePoints = React.useMemo(() => {
    if (!sparklineData || sparklineData.length === 0) {
      return { path: '', area: '', lastX: 200, lastY: 20 };
    }
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 200;
    const height = 40;
    const padding = 5;

    if (sparklineData.length === 1) {
      const y = height / 2;
      return {
        path: `M 0 ${y} L ${width} ${y}`,
        area: `M 0 ${y} L ${width} ${y} L ${width} ${height} L 0 ${height} Z`,
        lastX: width,
        lastY: y,
      };
    }

    const divisor = sparklineData.length - 1;
    const coords = sparklineData.map((val, idx) => {
      const x = (idx / divisor) * width;
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return { x, y };
    });

    const path = coords.reduce(
      (acc, pt, i) =>
        acc
          ? `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
          : `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      ''
    );
    const last = coords[coords.length - 1];
    const area = `${path} L ${width} ${height} L 0 ${height} Z`;

    return { path, area, lastX: last.x, lastY: last.y };
  }, [sparklineData]);

  const badgeClass = {
    positive: 'bg-secondary-container text-on-secondary-container',
    neutral: 'bg-surface-container-high text-on-surface',
    critical: 'bg-error-container text-error animate-pulse',
  }[badgeVariant];

  return (
    <div
      className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${
        isCritical ? 'border border-error-container' : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span
              className={`font-label-sm text-label-sm uppercase tracking-wider ${
                isCritical ? 'text-error font-bold' : 'text-on-surface-variant'
              }`}
            >
              {title}
            </span>
            <div className="flex items-baseline gap-space-xs mt-space-xs">
              <span
                className={`font-mono-metric text-mono-metric font-bold ${
                  isCritical ? 'text-error' : 'text-on-surface'
                }`}
              >
                {metric}
              </span>
              {unit && (
                <span className="font-mono-code text-mono-code text-on-surface-variant font-semibold">
                  {unit}
                </span>
              )}
            </div>
          </div>
          {badgeText && (
            <span
              className={`font-mono-code text-mono-code px-space-xs py-0.5 rounded font-semibold whitespace-nowrap ${badgeClass}`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {/* Critical variant extra info */}
        {isCritical && criticalMessage && (
          <div className="mt-space-sm p-space-xs rounded-lg bg-error-container/30 text-error font-mono-code text-mono-code">
            {criticalMessage}
          </div>
        )}
      </div>

      {/* Variant Sub-components */}
      <div className="mt-space-sm">
        {variant === 'sparkline' && (
          <div className="w-full h-10 mt-1">
            <svg
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
              className="w-full h-10 text-secondary"
            >
              <path
                d={sparklinePoints.area}
                fill="currentColor"
                className="opacity-10"
              />
              <path
                d={sparklinePoints.path}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={sparklinePoints.lastX}
                cy={sparklinePoints.lastY}
                r="3.5"
                fill="currentColor"
              />
            </svg>
          </div>
        )}

        {variant === 'progress' && (
          <div className="w-full mt-2">
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </div>
        )}

        {variant === 'mini-grid' && miniStats && (
          <div className="grid grid-cols-2 gap-space-xs mt-2">
            {miniStats.map((item, idx) => (
              <div
                key={idx}
                className="bg-surface-container-low p-space-xs rounded-lg flex flex-col"
              >
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                  {item.label}
                </span>
                <span className="font-mono-data text-mono-data font-bold text-on-surface">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {isCritical && actionButton && (
          <button
            onClick={actionButton.onClick}
            className="w-full mt-2 px-space-sm py-1 bg-primary-container hover:bg-inverse-surface text-surface-bright rounded text-label-md font-label-md transition-colors text-center"
          >
            {actionButton.label}
          </button>
        )}
      </div>
    </div>
  );
};

