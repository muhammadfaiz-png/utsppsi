import React from 'react';
import { Icon } from './Icon';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'dispatch'
  | 'danger'
  | 'filter-active-dark'
  | 'filter-active-light'
  | 'filter-inactive'
  | 'filter-inactive-dark';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  iconRight?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  iconRight,
  size = 'md',
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-space-xs py-0.5 text-label-sm font-label-sm',
    md: 'px-space-sm py-1 text-label-md font-label-md',
    lg: 'px-space-md py-2 text-label-md font-label-md',
  }[size];

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98]',
    secondary:
      'bg-surface-container hover:bg-surface-container-high text-on-surface active:scale-[0.98]',
    dispatch:
      'bg-primary-container hover:bg-inverse-surface text-surface-bright active:scale-[0.98]',
    danger:
      'bg-error hover:bg-error/90 text-on-error active:scale-[0.98]',
    'filter-active-dark':
      'bg-secondary-fixed text-on-secondary-fixed font-bold',
    'filter-active-light':
      'bg-primary-container text-surface-bright font-bold',
    'filter-inactive':
      'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface',
    'filter-inactive-dark':
      'bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 text-surface-bright/80 hover:text-surface-bright',
  };

  const isFilter = variant.startsWith('filter-');
  const roundedClass = isFilter ? 'rounded-md' : 'rounded';

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 ${roundedClass} ${sizeClasses} ${variantClasses[variant]} transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <Icon name={icon} className="text-sm" />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} className="text-sm" />}
    </button>
  );
};

