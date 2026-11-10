'use client';

import React, { useEffect, useCallback } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  description: string;
  impactWarning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'approve' | 'divert' | 'reject' | 'danger';
  icon?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  description,
  impactWarning,
  confirmLabel = 'Konfirmasi & Eksekusi',
  cancelLabel = 'Batal',
  variant = 'approve',
  icon,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const variantConfig = {
    approve: {
      iconBg: 'bg-secondary text-on-secondary',
      iconName: icon || 'check_circle',
      btnColor: 'bg-secondary hover:bg-secondary/90 text-on-secondary',
    },
    divert: {
      iconBg: 'bg-secondary-container text-on-secondary-container',
      iconName: icon || 'alt_route',
      btnColor: 'bg-primary-container hover:bg-inverse-surface text-surface-bright',
    },
    reject: {
      iconBg: 'bg-error text-on-error',
      iconName: icon || 'block',
      btnColor: 'bg-error hover:bg-error/90 text-on-error',
    },
    danger: {
      iconBg: 'bg-error text-on-error',
      iconName: icon || 'warning',
      btnColor: 'bg-error hover:bg-error/90 text-on-error',
    },
  }[variant];

  return (
    <div
      className="fixed inset-0 z-50 bg-primary-container/60 backdrop-blur-sm flex items-center justify-center p-space-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full max-w-md rounded-xl p-space-lg shadow-2xl border border-surface-container-high flex flex-col gap-space-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-space-md">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${variantConfig.iconBg}`}
          >
            <Icon name={variantConfig.iconName} className="text-2xl" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {title}
            </h3>
            {subtitle && (
              <span className="font-mono-code text-mono-code text-on-surface-variant font-semibold">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {description}
        </p>

        {impactWarning && (
          <div className="p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high">
            <div className="flex items-start gap-2">
              <Icon name="info" className="text-sm text-on-surface-variant shrink-0 mt-0.5" />
              <div className="font-body-sm text-body-sm text-on-surface font-medium">
                {impactWarning}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            className="px-space-md py-1.5 rounded font-label-md text-label-md bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-space-md py-1.5 rounded font-label-md text-label-md font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer ${variantConfig.btnColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
