'use client';

import React, { useEffect, useState } from 'react';

interface LiveClockProps {
  className?: string;
  showZone?: boolean;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  className = '',
  showZone = true,
}) => {
  const [timeStr, setTimeStr] = useState<string>('00:00:00');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setTimeStr(new Intl.DateTimeFormat('id-ID', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      suppressHydrationWarning
      className={`font-mono-metric font-bold text-on-surface inline-flex items-baseline gap-1 ${className}`}
    >
      <span>{mounted ? timeStr : '--:--:--'}</span>
      {showZone && (
        <span className="font-label-sm text-label-sm text-secondary">
          WIB
        </span>
      )}
    </span>
  );
};
