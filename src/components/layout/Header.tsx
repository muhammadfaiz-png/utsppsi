'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '../common/Icon';
import { PulseDot } from '../common/PulseDot';
import { LiveClock } from '../common/LiveClock';
import {
  sanitizeSearchQuery,
  isValidBatchCode,
  isValidLampungPlate,
} from '@/utils/security';

interface HeaderProps {
  alertCount?: number;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  alertCount = 2,
  onSearch,
}) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [securityBlocked, setSecurityBlocked] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const { sanitized, wasModified } = sanitizeSearchQuery(raw, 48);
    setSearchValue(sanitized);
    setSecurityBlocked(wasModified);
    if (onSearch) {
      onSearch(sanitized);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      const q = searchValue.trim().toUpperCase();
      if (isValidBatchCode(q)) {
        router.push(`/eudr/${q.replace(/^#/, '')}`);
      } else if (isValidLampungPlate(q)) {
        router.push('/gate');
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-margin flex items-center justify-between gap-gutter border-b border-surface-container-high/40">
      {/* 1. Logo & Title */}
      <div className="flex items-center gap-space-sm shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-container text-surface-bright flex items-center justify-center shadow-sm">
          <Icon name="hub" className="text-xl text-secondary-fixed" />
        </div>
        <div className="flex flex-col">
          <Link
            href="/command"
            className="font-label-md text-label-md uppercase tracking-tight text-on-surface hover:text-secondary transition-colors"
          >
            Lampung Commodity Hub
          </Link>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Agri-Export GIS Tracker
          </span>
        </div>
      </div>

      {/* 2. System Status Pills (hidden xl:flex) */}
      <div className="hidden xl:flex items-center gap-space-xs p-1 bg-surface-container-low rounded-lg text-on-surface">
        <div className="flex items-center gap-1.5 px-space-xs py-0.5 bg-surface-container-lowest rounded shadow-xs font-mono-code text-[11px]">
          <PulseDot color="secondary" size="sm" />
          <span className="text-on-surface-variant font-medium">PostGIS:</span>
          <span className="font-semibold text-secondary">Active (5.4ms)</span>
        </div>
        <div className="flex items-center gap-1.5 px-space-xs py-0.5 bg-surface-container-lowest rounded shadow-xs font-mono-code text-[11px]">
          <span className="text-on-surface-variant font-medium">MQTT Ingest:</span>
          <span className="font-semibold text-on-surface">15.2k req/s</span>
        </div>
        <div className="flex items-center gap-1.5 px-space-xs py-0.5 bg-surface-container-lowest rounded shadow-xs font-mono-code text-[11px]">
          <span className="text-on-surface-variant font-medium">GPS Fleet Lock:</span>
          <span className="font-semibold text-on-surface">148 Nodes</span>
        </div>
      </div>

      {/* 3. Location Pill (hidden md:flex) */}
      <div className="hidden md:flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm">
        <Icon name="pin_drop" className="text-sm text-secondary" />
        <span className="font-medium text-on-surface">
          Bandar Lampung Central & Panjang Corridor
        </span>
      </div>

      {/* 4. Hardened Search Input (hidden lg:block max-w-xs) */}
      <div className="hidden lg:block relative max-w-xs w-64">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-on-surface-variant">
          <Icon name="search" className="text-sm" />
        </div>
        <input
          type="text"
          value={searchValue}
          maxLength={48}
          aria-label="Cari Batch Komoditas atau Plat Nomor Armada"
          placeholder="Batch #KOP-LBG... / BE 8920 YU"
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          className={`w-full pl-8 pr-space-sm py-1 bg-surface-container-low rounded-lg font-mono-code text-mono-code text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 transition-all ${
            securityBlocked ? 'ring-1 ring-error' : 'focus:ring-secondary'
          }`}
        />
      </div>

      {/* 5. Right: Alerts, Time, Avatar */}
      <div className="flex items-center gap-space-sm shrink-0">
        {/* Alerts Pill */}
        <div
          className={`flex items-center gap-1 px-space-xs py-0.5 rounded font-mono-code text-mono-code text-[11px] font-bold ${
            alertCount > 0
              ? 'bg-error-container text-on-error-container animate-pulse'
              : 'bg-secondary-container text-on-secondary-container'
          }`}
        >
          <Icon
            name={alertCount > 0 ? 'warning' : 'check_circle'}
            className="text-xs"
          />
          <span>{alertCount} Temp Alerts</span>
        </div>

        {/* Live Clock / Command Status */}
        <div className="hidden sm:flex flex-col items-end">
          <LiveClock />
          <span className="font-mono-code text-[10px] text-on-surface-variant uppercase tracking-wider">
            Live Command
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-space-xs pl-space-xs border-l border-surface-container-high/60">
          <div className="w-8 h-8 rounded-full bg-primary-container text-secondary-fixed flex items-center justify-center font-bold text-xs select-none">
            OP
          </div>
          <div className="hidden 2xl:flex flex-col">
            <span className="font-label-md text-[11px] text-on-surface font-semibold leading-tight">
              Ir. Hendra Wijaya, S.T.
            </span>
            <span className="font-mono-code text-[10px] text-on-surface-variant leading-tight">
              NIP 198503142010011008 • Barantin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
