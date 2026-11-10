import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'surface' | 'container' | 'low' | 'high' | 'dark' | 'error';
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  hoverable = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    surface: 'bg-surface-container-lowest shadow-sm',
    container: 'bg-surface-container shadow-sm',
    low: 'bg-surface-container-low shadow-sm',
    high: 'bg-surface-container-high shadow-sm',
    dark: 'bg-primary-container text-surface-bright shadow-lg',
    error: 'bg-surface-container-lowest border border-error-container shadow-sm',
  };

  const hoverStyle = hoverable ? 'hover:shadow-md transition-shadow' : '';

  return (
    <div
      className={`rounded-xl ${variantStyles[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

