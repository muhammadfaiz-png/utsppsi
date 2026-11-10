import React from 'react';

interface FooterProps {
  isPublic?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isPublic = false }) => {
  return (
    <footer className="w-full bg-surface-container-lowest py-space-md px-margin shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-t border-surface-container-high/40 mt-auto select-none">
      <div className="flex flex-col md:flex-row items-center justify-between gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
        <div className="flex items-center gap-2 text-center md:text-left">
          <span>Pemkot Bandar Lampung</span>
          <span>•</span>
          <span>Pelindo Panjang</span>
          <span>•</span>
          <span className="font-semibold text-on-surface">
            Universitas Teknokrat Indonesia (UTI)
          </span>
        </div>
        <div className="text-center md:text-right font-mono-code text-[11px]">
          Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom
        </div>
      </div>
      {isPublic && (
        <div className="mt-space-xs pt-space-xs border-t border-surface-container-high/40 text-center font-mono-code text-[10px] text-on-surface-variant/80">
          Powered by PostgreSQL/PostGIS, Apache Sedona & IoT Lampung Commodity Telematics Engine.
        </div>
      )}
    </footer>
  );
};

