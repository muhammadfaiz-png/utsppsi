'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/common/DataTable';
import { Modal } from '@/components/common/Modal';
import { PulseDot } from '@/components/common/PulseDot';
import { LiveClock } from '@/components/common/LiveClock';
import { Icon } from '@/components/common/Icon';
import { mockTrucks } from '@/mocks/trucks';
import { mockIncidents } from '@/mocks/incidents';
import { mockManifests, ExportManifest } from '@/mocks/manifests';
import { TruckTelemetry, IncidentRecord } from '@/types';

export default function CommandPage() {
  const [selectedTruck, setSelectedTruck] = useState<TruckTelemetry>(mockTrucks[0]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(mockIncidents);
  const [activeLayer, setActiveLayer] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'divert'>('approve');
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  const handleDispatchSop = (incId: string, actionLabel: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incId
          ? { ...inc, status: 'DISPATCHED', sopDispatchedAction: actionLabel }
          : inc
      )
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. Command Strip (SKILL.md 6.1) */}
      <div className="bg-primary-container text-on-primary-container px-margin py-space-sm shadow-md flex flex-wrap items-center justify-between gap-gutter select-none">
        <div className="flex items-center gap-space-sm">
          <div className="flex items-center gap-1.5 px-space-xs py-0.5 rounded bg-surface-container-lowest/10 font-mono-code text-[11px] text-surface-bright font-bold">
            <PulseDot color="secondary-fixed" mode="ping" size="sm" />
            <span>Corridor State: TACTICAL DISPATCH LOCK</span>
          </div>
          <span className="hidden xl:inline font-mono-code text-[10px] text-on-primary-container">
            GEO-ANCHOR: LAT -5.4496 / LON 105.3129
          </span>
        </div>
        <div className="flex items-center gap-space-sm font-mono-code text-[11px] text-surface-bright">
          <div className="flex items-center gap-1">
            <Icon name="radar" className="text-sm text-secondary-fixed" />
            <span>Telemetry Engine Active</span>
          </div>
          <div className="h-3 w-px bg-on-primary-container/30" />
          <div className="flex items-center gap-1">
            <Icon name="satellite_alt" className="text-sm text-tertiary-fixed" />
            <span>Sentinel-2 EUDR Ingest</span>
          </div>
          <div className="h-3 w-px bg-on-primary-container/30" />
          <div className="px-space-xs py-0.5 rounded bg-surface-container-lowest/10">
            Sync: <LiveClock showZone={false} className="text-[11px] text-secondary-fixed" /> WIB
          </div>
        </div>
      </div>

      {/* 2. Content Container */}
      <div className="w-full p-margin flex flex-col gap-space-lg">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
          <KpiCard
            title="Daily Export Volume"
            metric="14,250"
            unit="MT / 24H"
            badgeText="+12.4% vs yday"
            badgeVariant="positive"
            variant="sparkline"
            sparklineData={[11200, 11800, 12400, 12100, 13400, 13900, 14250]}
          />
          <KpiCard
            title="Gate Congestion"
            metric="1.8"
            unit="/ 5.0 INDEX"
            badgeText="Normal Flow"
            badgeVariant="positive"
            variant="progress"
            progressPct={36}
          />
          <KpiCard
            title="Cold-Chain Excursions"
            metric={String(incidents.filter((i) => i.status === 'ACTIVE').length)}
            unit="CRITICAL TRUCKS"
            badgeText="SLA < 15 Min"
            badgeVariant="critical"
            variant="critical"
            criticalMessage="Reefer #BE 8412 AA suhu +24.2°C di JTTS KM 42+200"
            actionButton={{
              label: 'Dispatch Tim Mobile',
              onClick: () => {
                setActiveIncidentId('#INC-TEMP-8412');
                setModalType('reject');
                setModalOpen(true);
              },
            }}
          />
          <KpiCard
            title="EUDR Compliance Rate"
            metric="100.0%"
            unit="REG 2023/1115"
            badgeText="Zero Deforest"
            badgeVariant="positive"
            variant="mini-grid"
            miniStats={[
              { label: 'Verified Farms', value: '1,420 Plots' },
              { label: 'PostGIS Pass', value: '100% OK' },
            ]}
          />
        </div>

        {/* Main Split: GIS Map (7 cols) + Live Telemetry Stream (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* GIS Operations Map (SKILL.md 6.8) */}
          <div className="lg:col-span-7 bg-primary-container text-surface-bright rounded-xl overflow-hidden shadow-lg flex flex-col">
            {/* Control Strip */}
            <div className="bg-surface-container-lowest/10 backdrop-blur-md px-space-md py-space-sm flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="public" className="text-lg text-secondary-fixed" />
                <div>
                  <span className="font-label-md text-xs font-bold text-surface-bright block">
                    Bandar Lampung – JTTS – Pelabuhan Panjang GIS
                  </span>
                  <span className="font-mono-code text-[10px] text-on-primary-container">
                    PROJ: EPSG:4326 | WGS84 Dynamic Corridor
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {['ALL', 'JTTS Tol', 'Reefer GPS', 'EUDR Forests'].map((layer) => (
                  <Button
                    key={layer}
                    size="sm"
                    variant={
                      activeLayer === layer
                        ? 'filter-active-dark'
                        : 'filter-inactive-dark'
                    }
                    onClick={() => setActiveLayer(layer)}
                  >
                    {layer}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cartographic SVG Canvas */}
            <div className="relative w-full h-[440px] bg-[#0c1626] overflow-hidden select-none">
              <svg
                viewBox="0 0 800 440"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <pattern
                    id="gis-grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#6bd8cb"
                      strokeWidth="0.5"
                      opacity="0.2"
                    />
                  </pattern>
                </defs>
                <rect width="800" height="440" fill="url(#gis-grid)" />

                {/* Teluk Lampung Water Body */}
                <path
                  d="M 460 280 Q 530 250 620 265 L 800 310 L 800 440 L 420 440 Z"
                  fill="#082038"
                  stroke="#6bd8cb"
                  strokeWidth="1"
                  opacity="0.9"
                />
                <text
                  x="570"
                  y="385"
                  fill="#6bd8cb"
                  fontSize="11"
                  fontFamily="monospace"
                  letterSpacing="3"
                  opacity="0.6"
                >
                  TELUK LAMPUNG
                </text>

                {/* EUDR Agroforestry Zone (Ulubelu / Tanggamus) */}
                {(activeLayer === 'ALL' || activeLayer === 'EUDR Forests') && (
                  <g>
                    <polygon
                      points="40,55 180,40 210,150 65,175"
                      fill="#002113"
                      opacity="0.65"
                      stroke="#4edea3"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <text
                      x="60"
                      y="95"
                      fill="#6ffbbe"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      EUDR VERIFIED ZONE
                    </text>
                    <text
                      x="60"
                      y="110"
                      fill="#b9c7e4"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      Ulubelu & Liwa Plots
                    </text>
                  </g>
                )}

                {/* Buffer Holding Zone KM 42 */}
                <polygon
                  points="320,110 430,110 440,185 310,185"
                  fill="#006a61"
                  opacity="0.3"
                  stroke="#89f5e7"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text
                  x="325"
                  y="130"
                  fill="#89f5e7"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  BUFFER STAGING KM 42
                </text>

                {/* JTTS Toll Corridor */}
                {(activeLayer === 'ALL' || activeLayer === 'JTTS Tol') && (
                  <g>
                    <path
                      d="M 90 120 Q 250 130 375 150 T 555 265"
                      fill="none"
                      stroke="#005049"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 90 120 Q 250 130 375 150 T 555 265"
                      fill="none"
                      stroke="#4edea3"
                      strokeWidth="2.5"
                      strokeDasharray="8 4"
                    />
                  </g>
                )}

                {/* Bypass Soekarno-Hatta Arterial Road */}
                <path
                  d="M 210 250 Q 380 220 555 265"
                  fill="none"
                  stroke="#39475f"
                  strokeWidth="6"
                />
                <path
                  d="M 210 250 Q 380 220 555 265"
                  fill="none"
                  stroke="#89f5e7"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                />

                {/* Pelabuhan Panjang Terminal Box */}
                <rect
                  x="525"
                  y="245"
                  width="115"
                  height="45"
                  rx="6"
                  fill="#1b334d"
                  stroke="#6bd8cb"
                  strokeWidth="2"
                />
                <text
                  x="535"
                  y="265"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  PELABUHAN PANJANG
                </text>
                <text
                  x="535"
                  y="280"
                  fill="#89f5e7"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  Berth 01–04 • Gate 1–3
                </text>

                {/* Fleet Truck Nodes (Clickable) */}
                {(activeLayer === 'ALL' || activeLayer === 'Reefer GPS') &&
                  [
                    { truck: mockTrucks[0], x: 470, y: 225 },
                    { truck: mockTrucks[1], x: 375, y: 150 },
                    { truck: mockTrucks[2], x: 420, y: 240 },
                    { truck: mockTrucks[3], x: 515, y: 255 },
                    { truck: mockTrucks[4], x: 265, y: 135 },
                  ].map(({ truck, x, y }) => {
                    const isCrit = truck.reeferStatus === 'EXCURSION';
                    const isSelected = selectedTruck.truckPlate === truck.truckPlate;
                    return (
                      <g
                        key={truck.truckPlate}
                        onClick={() => setSelectedTruck(truck)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 18 : 13}
                          fill={isCrit ? '#ba1a1a' : '#006a61'}
                          opacity="0.35"
                          className="animate-ping"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r={isCrit ? 8 : 7}
                          fill={isCrit ? '#ba1a1a' : '#006a61'}
                          stroke={isSelected ? '#ffffff' : isCrit ? '#ffdad6' : '#89f5e7'}
                          strokeWidth={isSelected ? '3' : '2'}
                        />
                        <text
                          x={x + 12}
                          y={y + 4}
                          fill={isCrit ? '#ffdad6' : '#ffffff'}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {truck.truckPlate}
                        </text>
                      </g>
                    );
                  })}
              </svg>

              {/* Selected Truck Telemetry Overlay Popup */}
              <div className="absolute top-4 right-4 w-72 bg-primary-container/95 backdrop-blur-md rounded-lg shadow-xl p-space-sm border border-secondary-fixed/30 flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-on-primary-container/30 pb-1">
                  <span className="font-mono-code text-xs font-bold text-surface-bright">
                    {selectedTruck.truckPlate}
                  </span>
                  <StatusBadge
                    label={`${selectedTruck.temperatureC.toFixed(1)}°C • ${selectedTruck.reeferStatus}`}
                    variant={
                      selectedTruck.reeferStatus === 'EXCURSION' ? 'critical' : 'ok'
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono-code text-[10px]">
                  <div>
                    <span className="text-[9px] uppercase text-on-primary-container block">
                      PENGEMUDI
                    </span>
                    <span className="text-surface-bright font-semibold">
                      {selectedTruck.driverName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-primary-container block">
                      BATCH ID
                    </span>
                    <span className="text-secondary-fixed font-bold">
                      {selectedTruck.batchId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-primary-container block">
                      KECEPATAN & GATE
                    </span>
                    <span className="text-surface-bright">
                      {selectedTruck.speedKmh} km/h • {selectedTruck.targetGate.split(' ')[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-on-primary-container block">
                      E-SEAL RFID
                    </span>
                    <span className="text-tertiary-fixed font-semibold">
                      {selectedTruck.eSealId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-on-primary-container/20">
                  <Link
                    href="/driver"
                    className="font-mono-code text-[10px] text-secondary-fixed hover:underline"
                  >
                    Buka Driver Console →
                  </Link>
                  <Link
                    href="/gate"
                    className="font-mono-code text-[10px] text-tertiary-fixed hover:underline"
                  >
                    Inspeksi Gate →
                  </Link>
                </div>
              </div>

              {/* Bottom Coordinate Overlay Bar */}
              <div className="absolute bottom-3 left-3 bg-primary-container/90 px-space-sm py-1 rounded font-mono-code text-[10px] text-on-primary-container flex items-center gap-3">
                <span>
                  LAT {selectedTruck.currentLat.toFixed(4)} / LON{' '}
                  {selectedTruck.currentLng.toFixed(4)}
                </span>
                <span>•</span>
                <span className="text-secondary-fixed">
                  Klik titik truk di peta untuk detail telemetri
                </span>
              </div>
            </div>

            {/* Lower Action Bar */}
            <div className="bg-surface-container-lowest/10 px-space-md py-space-xs flex items-center justify-between font-mono-code text-[10px] text-on-primary-container">
              <span>
                Layers: 6 Vector Active • Spatial Engine: PostGIS 3.4 / pgRouting
              </span>
              <span className="text-secondary-fixed font-semibold">
                5 Active Reefer Nodes Locked
              </span>
            </div>
          </div>

          {/* Right Column: Live Telemetry Table (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <Card variant="surface" className="p-space-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Live Corridor Telemetry Stream
                </span>
                <StatusBadge label="LIVE FEED" variant="live" dot />
              </div>

              <DataTable<TruckTelemetry>
                variant="telemetry-mono"
                keyExtractor={(row) => row.truckPlate}
                isRowAlert={(row) => row.reeferStatus === 'EXCURSION'}
                onRowClick={(row) => setSelectedTruck(row)}
                columns={[
                  {
                    header: 'NO. PLAT',
                    cell: (row) => (
                      <span className="font-bold text-on-surface">
                        {row.truckPlate}
                      </span>
                    ),
                  },
                  { header: 'PENGEMUDI', accessorKey: 'driverName' },
                  {
                    header: 'SUHU',
                    cell: (row) => (
                      <span
                        className={
                          row.reeferStatus === 'EXCURSION'
                            ? 'font-bold text-error animate-pulse'
                            : 'font-semibold text-secondary'
                        }
                      >
                        {row.temperatureC.toFixed(1)}°C
                      </span>
                    ),
                  },
                  {
                    header: 'SPEED',
                    cell: (row) => <span>{row.speedKmh} km/h</span>,
                  },
                  {
                    header: 'STATUS',
                    cell: (row) => (
                      <StatusBadge
                        label={row.reeferStatus}
                        variant={
                          row.reeferStatus === 'EXCURSION' ? 'critical' : 'ok'
                        }
                      />
                    ),
                  },
                ]}
                data={mockTrucks}
              />

              <div className="pt-space-xs border-t border-surface-container flex items-center justify-between font-mono-code text-[10px] text-on-surface-variant">
                <span>MQTT Topic: /telemetry/corridor/#</span>
                <span>Klik baris untuk fokus di peta GIS</span>
              </div>
            </Card>

            {/* Quick Module Navigation & Verification Card */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Akses Cepat Modul Operasional
                </span>
                <StatusBadge label="4 MODUL AKTIF" variant="ok" pill />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs">
                <Link
                  href="/driver"
                  className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors flex flex-col gap-1"
                >
                  <Icon name="local_shipping" className="text-lg text-secondary" />
                  <span className="font-label-md text-xs font-bold text-on-surface">
                    Driver Console
                  </span>
                  <span className="font-mono-code text-[10px] text-on-surface-variant">
                    QR E-Pass & Rute
                  </span>
                </Link>
                <Link
                  href="/gate"
                  className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors flex flex-col gap-1"
                >
                  <Icon name="dock" className="text-lg text-secondary" />
                  <span className="font-label-md text-xs font-bold text-on-surface">
                    Port Gate ALPR
                  </span>
                  <span className="font-mono-code text-[10px] text-on-surface-variant">
                    3-Way Decision Matrix
                  </span>
                </Link>
                <Link
                  href="/eudr/KOP-LBG-2026-0891"
                  className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors flex flex-col gap-1"
                >
                  <Icon name="verified" className="text-lg text-secondary" />
                  <span className="font-label-md text-xs font-bold text-on-surface">
                    EUDR Passport
                  </span>
                  <span className="font-mono-code text-[10px] text-on-surface-variant">
                    Poligon & SHA-256
                  </span>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* 3. Pusat Respon Insiden (SKILL.md 6.10) */}
        <Card variant="error" className="p-space-md flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-gutter pb-space-xs border-b border-error-container">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-xl bg-error text-on-error animate-pulse flex items-center justify-center">
                <Icon name="e911_emergency" className="text-2xl" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm uppercase font-bold text-on-surface">
                    Pusat Respon Insiden & Mitigasi Cold-Chain
                  </h2>
                  <StatusBadge label="REAL-TIME SOP DISPATCH" variant="critical" />
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Pemantauan otomatis anomali suhu reefer, deviasi geofence rute, dan integritas segel elektronik
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge label="SIAGA TINGKAT 1" variant="warning" pill />
              <Button
                variant="dispatch"
                icon="cell_tower"
                onClick={() => {
                  setModalType('approve');
                  setModalOpen(true);
                }}
              >
                Broadcast SOP Radio
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-sm">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className={`bg-surface-container-low rounded-xl p-space-md border flex flex-col justify-between gap-space-sm ${
                  inc.severity === 'CRITICAL'
                    ? 'border-error-container'
                    : 'border-secondary/20'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[11px] font-bold text-on-surface">
                      INSIDEN {inc.id}
                    </span>
                    <StatusBadge
                      label={inc.status}
                      variant={
                        inc.status === 'DISPATCHED'
                          ? 'ok'
                          : inc.severity === 'CRITICAL'
                          ? 'critical'
                          : 'warning'
                      }
                    />
                  </div>
                  <h3 className="font-label-md text-sm font-bold text-on-surface">
                    {inc.title}
                  </h3>
                  <div className="bg-surface-container-lowest px-space-xs py-1 rounded font-mono-code text-[11px] font-bold text-error">
                    {inc.detectedValue}
                  </div>
                  <div className="font-body-sm text-xs text-on-surface-variant flex flex-col gap-0.5">
                    <span>
                      <strong>Armada:</strong> {inc.truckPlate} ({inc.batchId})
                    </span>
                    <span>
                      <strong>Lokasi:</strong> {inc.locationLabel}
                    </span>
                    <span>
                      <strong>Diagnostik IoT:</strong> {inc.iotDiagnostic}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-container flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="danger"
                    icon="send_to_mobile"
                    onClick={() =>
                      handleDispatchSop(inc.id, 'Tim Teknisi Mobile Dikirim')
                    }
                  >
                    {inc.status === 'DISPATCHED'
                      ? 'SOP Terkirim ✓'
                      : 'Kirim Tim Mobile'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="alt_route"
                    onClick={() =>
                      handleDispatchSop(inc.id, 'Alihkan ke Buffer KM 42')
                    }
                  >
                    Rute Buffer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 4. Tabel Manifest Ekspor & Karantina (SKILL.md 6.7) */}
        <Card variant="surface" className="p-space-md flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-space-xs border-b border-surface-container-high">
            <div>
              <span className="font-headline-sm text-headline-sm text-on-surface block">
                Daftar Manifest Ekspor & Kepatuhan Karantina (Barantin / Bea Cukai)
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Sinkronisasi dokumen PEB/NPE INSW, KT-12 BKHIT, dan paspor komoditas EUDR
              </span>
            </div>
            <StatusBadge label="5 MANIFEST AKTIF" variant="ok" />
          </div>

          <DataTable<ExportManifest>
            variant="manifest-standard"
            keyExtractor={(row) => row.manifestId}
            columns={[
              {
                header: 'NO. MANIFEST',
                cell: (row) => (
                  <span className="font-mono-code font-bold text-on-surface">
                    {row.manifestId}
                  </span>
                ),
              },
              {
                header: 'BATCH PASPOR',
                cell: (row) => (
                  <Link
                    href={`/eudr/${row.batchId.replace('#', '')}`}
                    className="font-mono-code font-bold text-secondary hover:underline"
                  >
                    {row.batchId}
                  </Link>
                ),
              },
              { header: 'EKSPORTIR / KOPERASI', accessorKey: 'exporter' },
              { header: 'KOMODITAS', accessorKey: 'commodity' },
              {
                header: 'TONASE',
                cell: (row) => (
                  <span className="font-mono-code font-semibold">
                    {row.weightMt.toFixed(1)} MT
                  </span>
                ),
              },
              {
                header: 'BEA CUKAI',
                cell: (row) => (
                  <StatusBadge
                    label={row.customsStatus}
                    variant={
                      row.customsStatus === 'NPE RELEASED' ? 'ok' : 'neutral'
                    }
                  />
                ),
              },
              {
                header: 'KARANTINA',
                align: 'right',
                cell: (row) => (
                  <StatusBadge
                    label={row.quarantineStatus}
                    variant={
                      row.quarantineStatus === 'KT-12 ISSUED' ? 'ok' : 'warning'
                    }
                  />
                ),
              },
            ]}
            data={mockManifests}
          />
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          if (activeIncidentId) {
            handleDispatchSop(activeIncidentId, 'Tim Mobile & Pengalihan Buffer Dieksekusi');
          }
        }}
        variant={modalType === 'approve' ? 'approve' : 'reject'}
        title={
          modalType === 'approve'
            ? 'Broadcast Instruksi SOP Koridor via Radio & Kabin'
            : 'Eksekusi Tanggap Darurat Excursion Suhu Reefer'
        }
        subtitle="ARMADA #BE 8412 AA • BATCH #KOP-LBG-2026-0892"
        description={
          modalType === 'approve'
            ? 'Anda akan mengirimkan siaran protokol kecepatan dan penjadwalan slot gerbang ke seluruh 148 unit armada aktif di koridor JTTS – Pelabuhan Panjang.'
            : 'Truk #BE 8412 AA mengalami penyimpangan suhu (+24.2°C). Sistem akan mengerahkan teknisi reefer mobile ke KM 42 dan mengarahkan armada ke Buffer Holding.'
        }
        impactWarning="Dampak Operasional: Status insiden langsung diperbarui pada layar City Command dan diteruskan ke konsol pengemudi."
        confirmLabel={
          modalType === 'approve' ? 'Kirim Broadcast SOP' : 'Dispatch Tim Mobile Sekarang'
        }
      />
    </div>
  );
}
