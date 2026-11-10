'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../common/Icon';
import { PulseDot } from '../common/PulseDot';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'City Command & GIS',
      href: '/command',
      icon: 'dashboard',
    },
    {
      label: 'Driver Console & E-Pass',
      href: '/driver',
      icon: 'local_shipping',
    },
    {
      label: 'Port Gate & Inspection',
      href: '/gate',
      icon: 'dock',
    },
    {
      label: 'EUDR Traceability',
      href: '/eudr/KOP-LBG-2026-0891',
      icon: 'verified',
    },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-surface-container-low z-40 flex flex-col justify-between py-space-md border-r border-surface-container-high/40">
      <div className="flex flex-col px-space-sm">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant px-space-xs mb-space-sm">
          Operational Modules
        </span>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/command'
                ? pathname === '/command'
                : item.href.startsWith('/eudr')
                ? pathname.startsWith('/eudr')
                : pathname.startsWith(item.href.split('?')[0]);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-space-sm px-space-sm py-space-sm rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`text-lg ${
                    isActive ? 'text-secondary-fixed' : 'text-on-surface-variant'
                  }`}
                />
                <span className="font-body-md text-body-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Port Status Card */}
      <div className="mx-space-sm p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon name="anchor" className="text-sm text-secondary" />
            <span className="font-label-md text-[11px] font-bold text-on-surface">
              Pelabuhan Panjang
            </span>
          </div>
          <PulseDot color="secondary" size="sm" />
        </div>
        <div className="flex flex-col gap-1 pt-1 border-t border-surface-container">
          <div className="flex items-center justify-between font-mono-code text-[10px]">
            <span className="text-on-surface-variant">Berth 04:</span>
            <span className="font-semibold text-secondary">Loading CPO</span>
          </div>
          <div className="flex items-center justify-between font-mono-code text-[10px]">
            <span className="text-on-surface-variant">Berth 02:</span>
            <span className="font-semibold text-on-surface">Kopi Robusta</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

