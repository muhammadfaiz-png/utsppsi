import React from 'react';
import { PulseDot } from './PulseDot';

export type BadgeVariant =
  | 'ok'
  | 'neutral'
  | 'critical'
  | 'warning'
  | 'active'
  | 'live';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  pill?: boolean;
  className?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'ok',
  pill = false,
  className = '',
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    ok: 'bg-secondary-container text-on-secondary-container',
    neutral: 'bg-surface-container-high text-on-surface',
    critical: 'bg-error text-on-error animate-pulse',
    warning: 'bg-error-container text-error',
    active: 'bg-primary-container text-surface-bright',
    live: 'bg-surface-container-high text-secondary',
  };

  const rounded = pill ? 'rounded-full' : 'rounded';

  return (
    <span
      className={`inline-flex items-center gap-1 px-space-xs py-0.5 ${rounded} font-mono-code text-mono-code text-[10px] font-bold tracking-wider select-none ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <PulseDot
          color={variant === 'critical' ? 'error' : 'secondary'}
          size="sm"
        />
      )}
      {label}
    </span>
  );
};

