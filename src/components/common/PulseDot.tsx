import React from 'react';

interface PulseDotProps {
  color?: 'secondary' | 'error' | 'secondary-fixed' | 'tertiary-fixed';
  mode?: 'pulse' | 'ping' | 'both';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PulseDot: React.FC<PulseDotProps> = ({
  color = 'secondary',
  mode = 'pulse',
  size = 'md',
  className = '',
}) => {
  const colorBg = {
    secondary: 'bg-secondary',
    error: 'bg-error',
    'secondary-fixed': 'bg-secondary-fixed',
    'tertiary-fixed': 'bg-tertiary-fixed',
  }[color];

  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  if (mode === 'both') {
    return (
      <span className={`relative inline-flex items-center justify-center ${sizeClasses} ${className}`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorBg} opacity-75`} />
        <span className={`relative inline-flex rounded-full ${sizeClasses} ${colorBg}`} />
      </span>
    );
  }

  if (mode === 'ping') {
    return (
      <span className={`relative inline-flex items-center justify-center ${sizeClasses} ${className}`}>
        <span className={`animate-ping inline-flex rounded-full ${sizeClasses} ${colorBg} opacity-75`} />
      </span>
    );
  }

  return (
    <span className={`inline-block rounded-full ${sizeClasses} ${colorBg} animate-pulse ${className}`} />
  );
};

