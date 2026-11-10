'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../common/Icon';
import { LiveClock } from '../common/LiveClock';
import { PulseDot } from '../common/PulseDot';

export const PublicHeader: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'City Command & GIS', href: '/command' },
    { label: 'Driver Console & E-Pass', href: '/driver' },
    { label: 'Port Gate & Inspection', href: '/gate' },
    { label: 'EUDR Traceability', href: '/eudr/KOP-LBG-2026-0891' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-margin flex items-center justify-between gap-gutter border-b border-surface-container-high/40">
      {/* Logo */}
      <div className="flex items-center gap-space-sm shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-container text-surface-bright flex items-center justify-center shadow-sm">
          <Icon name="verified" className="text-xl text-secondary-fixed" />
        </div>
        <div className="flex flex-col">
          <Link
            href="/command"
            className="font-label-md text-label-md uppercase tracking-tight text-on-surface hover:text-secondary transition-colors"
          >
            Lampung Commodity Hub
          </Link>
          <span className="font-label-sm text-label-sm text-secondary font-bold">
            Public EUDR Traceability Portal
          </span>
        </div>
      </div>

      {/* Horizontal Nav (hidden md:flex) */}
      <nav className="hidden md:flex items-center gap-space-xs">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href.split('?')[0]);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-space-sm py-space-xs rounded-lg font-body-sm text-body-sm transition-all ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right status */}
      <div className="flex items-center gap-space-sm">
        <div className="flex items-center gap-1.5 px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono-code text-[11px] font-bold">
          <PulseDot color="secondary" size="sm" />
          <span>VERIFIED PORTAL</span>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <LiveClock />
          <span className="font-mono-code text-[10px] text-secondary font-semibold">
            EU Regulation 2023/1115
          </span>
        </div>
      </div>
    </header>
  );
};

