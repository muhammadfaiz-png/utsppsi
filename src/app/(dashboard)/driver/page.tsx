'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { PulseDot } from '@/components/common/PulseDot';
import { LiveClock } from '@/components/common/LiveClock';
import { Icon } from '@/components/common/Icon';
import { mockTrucks } from '@/mocks/trucks';
import { mockBatches } from '@/mocks/batches';
import { mockGateQueue } from '@/mocks/gateQueue';

export default function DriverConsolePage() {
  const [selectedPlate, setSelectedPlate] = useState<string>(mockTrucks[0].truckPlate);
  const [passLocked, setPassLocked] = useState<boolean>(true);
  const [checkedIn, setCheckedIn] = useState<boolean>(false);
  const [modalConfig, setModalConfig] = useState<{
    open: boolean;
    title: string;
    subtitle: string;
    description: string;
    impactWarning: string;
    confirmLabel: string;
    variant: 'approve' | 'divert' | 'reject' | 'danger';
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    subtitle: '',
    description: '',
    impactWarning: '',
    confirmLabel: 'Konfirmasi',
    variant: 'approve',
    onConfirm: () => {},
  });

  const currentTruck =
    mockTrucks.find((t) => t.truckPlate === selectedPlate) || mockTrucks[0];
  const currentBatch =
    mockBatches[currentTruck.batchId] || mockBatches['#KOP-LBG-2026-0891'];
  const currentQueue =
    mockGateQueue.find((q) => q.truckPlate === currentTruck.truckPlate) ||
    mockGateQueue[0];

  const isExcursion = currentTruck.reeferStatus === 'EXCURSION';

  const checkpoints = [
    {
      name: `Origin Hub: ${currentTruck.origin}`,
      time: '13:15 WIB',
      status: 'PASSED',
      detail: 'Muatan disegel E-Seal RFID & verifikasi poligon EUDR selesai',
    },
    {
      name: 'Gerbang Tol JTTS (Natar / Terbanggi)',
      time: '14:40 WIB',
      status: 'PASSED',
      detail: 'Telemetri MQTT stabil • Kecepatan rata-rata 60 km/h',
    },
    {
      name: 'Buffer Zone Holding KM 42 / Bypass Soekarno-Hatta',
      time: '15:55 WIB',
      status: isExcursion ? 'HOLD' : 'PASSED',
      detail: isExcursion
        ? 'PERINGATAN: Suhu reefer menyimpang (+24.2°C). Wajib inspeksi teknisi mobile.'
        : 'Slot antrian Virtual Gate terkonfirmasi otomatis via geofence',
    },
    {
      name: `${currentTruck.destination} — ${currentTruck.targetGate}`,
      time: currentQueue.timeSlot + ' WIB',
      status: checkedIn ? 'PASSED' : 'NEXT',
      detail: checkedIn
        ? 'Check-in berhasil. Silakan menuju jalur timbangan ALPR.'
        : 'Target ingate pelabuhan • Siapkan pemindaian QR E-Pass di kabin',
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Console Header (SKILL.md 6.2) */}
      <div className="w-full bg-surface-container-low px-margin py-space-md shadow-sm flex flex-wrap items-center justify-between gap-gutter border-b border-surface-container-high/50">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <Icon name="local_shipping" className="text-2xl text-secondary-fixed" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-sm text-headline-sm text-on-surface">
                Driver Console & Digital E-Pass
              </h1>
              <span className="px-space-xs py-0.5 rounded bg-secondary text-on-secondary font-mono-code text-[10px] font-bold uppercase tracking-wider">
                CABIN TELEMATICS HUD
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono-code text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Icon name="badge" className="text-xs text-secondary" />
                Pengemudi: <strong className="text-on-surface">{currentTruck.driverName}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="verified_user" className="text-xs text-secondary" />
                E-Seal: <strong className="text-on-surface">{currentTruck.eSealId}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Fleet Selector & Operational Clock */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-space-sm py-1.5 rounded-xl shadow-sm">
            <Icon name="directions_car" className="text-sm text-secondary" />
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
              Pilih Armada:
            </span>
            <select
              value={selectedPlate}
              onChange={(e) => {
                setSelectedPlate(e.target.value);
                setCheckedIn(false);
              }}
              className="bg-surface-container-low px-2 py-1 rounded font-mono-code text-[11px] font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              {mockTrucks.map((truck) => (
                <option key={truck.truckPlate} value={truck.truckPlate}>
                  {truck.truckPlate} — {truck.driverName}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm px-space-md py-1.5 flex items-center gap-space-md">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Waktu Operasional
              </span>
              <LiveClock className="font-mono-metric text-sm font-bold text-on-surface" />
            </div>
            <div className="w-px h-8 bg-surface-container" />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Slot Kedatangan
              </span>
              <span className="font-mono-code text-xs font-bold text-secondary">
                {currentQueue.timeSlot} WIB
              </span>
            </div>
            <div className="w-px h-8 bg-surface-container" />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Antrian Gate
              </span>
              <span className="font-mono-code text-xs font-bold text-on-surface">
                #{currentQueue.queueNumber} ({currentQueue.priorityStatus})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Content Container */}
      <div className="w-full p-margin flex flex-col gap-space-lg">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
          <KpiCard
            title="Suhu Kabin Reefer"
            metric={`${currentTruck.temperatureC.toFixed(1)}°C`}
            unit={`RH ${currentTruck.humidityPct}%`}
            badgeText={isExcursion ? 'EXCURSION ALERT' : 'OPTIMAL 17-19°C'}
            badgeVariant={isExcursion ? 'critical' : 'positive'}
            variant={isExcursion ? 'critical' : 'sparkline'}
            sparklineData={currentQueue.temperatureHistory.map((t) => t.temp)}
            criticalMessage={
              isExcursion
                ? 'Suhu melampaui ambang 22.0°C! Segera menepi ke Buffer Holding KM 42.'
                : undefined
            }
          />
          <KpiCard
            title="Progres Koridor Rute"
            metric={`${currentTruck.routeProgressPct}%`}
            unit={`${currentTruck.speedKmh} KM/H`}
            badgeText="GPS Locked"
            badgeVariant="positive"
            variant="progress"
            progressPct={currentTruck.routeProgressPct}
          />
          <KpiCard
            title="Integritas Segel & Pintu"
            metric={currentTruck.doorLocked ? 'TERKUNCI' : 'TERBUKA'}
            unit={currentTruck.eSealId}
            badgeText="RFID SECURE"
            badgeVariant="positive"
            variant="mini-grid"
            miniStats={[
              { label: 'Sensor Pintu', value: 'Closed (OK)' },
              { label: 'Baterai IoT', value: '94% (4.1V)' },
            ]}
          />
          <KpiCard
            title="Target Dermaga & Gate"
            metric={currentTruck.targetGate.split(' ')[0] + ' ' + currentTruck.targetGate.split(' ')[1]}
            unit="PELINDO PANJANG"
            badgeText={checkedIn ? 'CHECKED IN' : currentQueue.priorityStatus}
            badgeVariant={isExcursion ? 'critical' : 'positive'}
            variant="mini-grid"
            miniStats={[
              { label: 'Tujuan', value: currentTruck.destination.replace('Pelabuhan Panjang ', '') },
              { label: 'Batch ID', value: currentTruck.batchId },
            ]}
          />
        </div>

        {/* Main Split: Left E-Pass & Route (7 cols), Right Cold-Chain & Batch Dossier (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            {/* Digital Gate E-Pass Card */}
            <Card variant="dark" className="p-space-lg flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-space-sm border-b border-surface-container-lowest/15">
                <div className="flex items-center gap-2">
                  <PulseDot color="secondary-fixed" mode="ping" size="sm" />
                  <span className="font-mono-code text-xs uppercase tracking-widest text-secondary-fixed font-bold">
                    DIGITAL GATE PASS & RESERVATION TOKEN
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-space-xs py-0.5 rounded bg-surface-container-lowest/15 font-mono-code text-[11px] text-surface-bright font-bold">
                    PASS-2026-X8919
                  </span>
                  <StatusBadge
                    label={passLocked ? 'TOKEN LOCKED & VERIFIED' : 'TOKEN UNLOCKED'}
                    variant={passLocked ? 'ok' : 'warning'}
                    pill
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
                {/* Simulated QR Code Box */}
                <div className="md:col-span-4 flex flex-col items-center justify-center bg-surface-container-lowest text-on-surface p-space-md rounded-xl shadow-md">
                  <div className="w-36 h-36 bg-surface-container-low rounded-lg p-2 flex flex-col items-center justify-center relative border border-surface-container-high">
                    <Icon name="qr_code_2" className="text-[96px] text-primary leading-none" />
                    <span className="font-mono-code text-[9px] font-bold text-secondary mt-1">
                      ED25519 SIGNED
                    </span>
                  </div>
                  <span className="font-mono-code text-[11px] font-bold text-on-surface mt-2">
                    {currentTruck.truckPlate}
                  </span>
                  <span className="font-mono-code text-[10px] text-on-surface-variant">
                    Scan pada Gate ALPR Pelindo
                  </span>
                </div>

                {/* E-Pass Details */}
                <div className="md:col-span-8 flex flex-col gap-space-sm">
                  <div className="grid grid-cols-2 gap-space-sm">
                    <div className="bg-surface-container-lowest/10 p-space-sm rounded-lg">
                      <span className="font-label-sm text-label-sm uppercase text-on-primary-container block">
                        Nomor Plat & Armada
                      </span>
                      <span className="font-mono-metric text-lg font-bold text-surface-bright">
                        {currentTruck.truckPlate}
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest/10 p-space-sm rounded-lg">
                      <span className="font-label-sm text-label-sm uppercase text-on-primary-container block">
                        Batch Paspor Komoditas
                      </span>
                      <span className="font-mono-data text-sm font-bold text-secondary-fixed">
                        {currentTruck.batchId}
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest/10 p-space-sm rounded-lg">
                      <span className="font-label-sm text-label-sm uppercase text-on-primary-container block">
                        Komoditas & Tonase
                      </span>
                      <span className="font-body-sm text-xs font-semibold text-surface-bright">
                        {currentTruck.commodity}
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest/10 p-space-sm rounded-lg">
                      <span className="font-label-sm text-label-sm uppercase text-on-primary-container block">
                        Koordinat GPS Saat Ini
                      </span>
                      <span className="font-mono-code text-xs text-tertiary-fixed">
                        {currentTruck.currentLat.toFixed(4)}, {currentTruck.currentLng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      variant="secondary"
                      icon={passLocked ? 'lock_open' : 'lock'}
                      onClick={() =>
                        setModalConfig({
                          open: true,
                          title: passLocked
                            ? 'Buka Kunci Gate Pass Sementara'
                            : 'Kunci Kembali Digital Gate Pass',
                          subtitle: `${currentTruck.truckPlate} • ${currentTruck.batchId}`,
                          description: passLocked
                            ? 'Membuka kunci token memungkinkan pembaruan slot waktu kedatangan apabila truk tertahan di jalur arteri.'
                            : 'Mengunci Gate Pass akan mengenkripsi ulang QR Token Ed25519 untuk pemindaian otomatis di gerbang Pelabuhan Panjang.',
                          impactWarning:
                            'Dampak Operasional: Status token disinkronkan secara real-time ke sistem TOS Pelindo Regional 2 Panjang.',
                          confirmLabel: passLocked ? 'Buka Kunci Pass' : 'Kunci Gate Pass',
                          variant: passLocked ? 'divert' : 'approve',
                          onConfirm: () => setPassLocked(!passLocked),
                        })
                      }
                    >
                      {passLocked ? 'Ubah Slot / Buka Kunci' : 'Kunci Gate Pass'}
                    </Button>

                    <Button
                      variant="primary"
                      icon="share_location"
                      onClick={() =>
                        setModalConfig({
                          open: true,
                          title: 'Konfirmasi Check-In Geofence Pelabuhan',
                          subtitle: `${currentTruck.truckPlate} • ${currentTruck.targetGate}`,
                          description:
                            'Anda akan mengirimkan sinyal kedatangan armada ke sistem antrian Virtual Gate Pelabuhan Panjang dan mengaktifkan pemindaian kamera ALPR.',
                          impactWarning:
                            'Dampak Operasional: Nomor antrian akan dipanggil pada layar LED Jalur Ingate dalam waktu < 3 menit.',
                          confirmLabel: 'Konfirmasi Check-In Sekarang',
                          variant: 'approve',
                          onConfirm: () => setCheckedIn(true),
                        })
                      }
                    >
                      {checkedIn ? 'Sudah Check-In Geofence' : 'Check-In Geofence Gate'}
                    </Button>

                    <Link
                      href={`/eudr/${currentTruck.batchId.replace('#', '')}`}
                      className="inline-flex items-center gap-1 px-space-sm py-1 rounded bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-secondary-fixed font-label-md text-label-md transition-colors"
                    >
                      <Icon name="verified" className="text-sm" />
                      <span>Lihat Paspor EUDR</span>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>

            {/* Corridor Checkpoints Timeline */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <Icon name="alt_route" className="text-lg text-secondary" />
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Tahapan Koridor Logistik & Geofence Checkpoints
                  </span>
                </div>
                <span className="font-mono-code text-[11px] text-on-surface-variant">
                  Asal: {currentTruck.origin}
                </span>
              </div>

              <div className="flex flex-col gap-space-sm">
                {checkpoints.map((cp, idx) => (
                  <div
                    key={idx}
                    className={`p-space-sm rounded-lg flex items-start justify-between gap-space-sm ${
                      cp.status === 'HOLD'
                        ? 'bg-error-container/25 border border-error-container'
                        : 'bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-start gap-space-sm">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono-code text-xs font-bold ${
                          cp.status === 'PASSED'
                            ? 'bg-secondary text-on-secondary'
                            : cp.status === 'HOLD'
                            ? 'bg-error text-on-error animate-pulse'
                            : 'bg-primary-container text-surface-bright'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          {cp.name}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {cp.detail}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-mono-code text-[11px] font-bold text-on-surface">
                        {cp.time}
                      </span>
                      <StatusBadge
                        label={cp.status}
                        variant={
                          cp.status === 'PASSED'
                            ? 'ok'
                            : cp.status === 'HOLD'
                            ? 'critical'
                            : 'active'
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            {/* Cold-Chain Temperature Graph (SKILL.md 6.14) */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
                <div className="flex items-center gap-1.5">
                  <Icon name="device_thermostat" className="text-lg text-secondary" />
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Grafik Suhu Cold-Chain
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono-code text-[11px]">
                  <span className="text-on-surface-variant">Threshold: Max 22.0°C</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded ${
                      isExcursion
                        ? 'bg-error text-on-error animate-pulse'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    CURR: {currentTruck.temperatureC.toFixed(1)}°C
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col justify-between">
                <div className="flex justify-between font-mono-code text-[10px] text-on-surface-variant mb-1">
                  {currentQueue.temperatureHistory.map((pt, i) => (
                    <span key={i}>
                      {pt.time} ({pt.temp.toFixed(1)}°C)
                    </span>
                  ))}
                </div>

                <svg
                  viewBox="0 0 600 60"
                  preserveAspectRatio="none"
                  className="w-full h-16 overflow-visible"
                >
                  {/* Threshold dashed line */}
                  <line
                    x1="0"
                    y1="15"
                    x2="600"
                    y2="15"
                    stroke="#ba1a1a"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.4"
                  />
                  {/* Spline path */}
                  <path
                    d={
                      isExcursion
                        ? 'M 0 45 L 200 35 L 400 18 L 600 6'
                        : 'M 0 42 L 200 40 L 400 38 L 600 39'
                    }
                    fill="none"
                    stroke={isExcursion ? '#ba1a1a' : '#006a61'}
                    strokeWidth="2.5"
                  />
                  <circle cx="0" cy={isExcursion ? 45 : 42} r="3.5" fill="#ffffff" stroke="#006a61" strokeWidth="2" />
                  <circle cx="200" cy={isExcursion ? 35 : 40} r="3.5" fill="#ffffff" stroke="#006a61" strokeWidth="2" />
                  <circle cx="400" cy={isExcursion ? 18 : 38} r="3.5" fill="#ffffff" stroke={isExcursion ? '#ba1a1a' : '#006a61'} strokeWidth="2" />
                  <circle
                    cx="600"
                    cy={isExcursion ? 6 : 39}
                    r="4.5"
                    fill={isExcursion ? '#ba1a1a' : '#006a61'}
                    className="animate-pulse"
                  />
                </svg>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container font-mono-code text-[10px]">
                  <span className={isExcursion ? 'text-error font-bold' : 'text-secondary font-semibold'}>
                    {isExcursion ? 'Excursion Terdeteksi (>22.0°C)' : 'Zero Excursions Detected'}
                  </span>
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <Icon name="lock" className="text-xs text-secondary" />
                    SHA-256 IoT Ledger
                  </span>
                </div>
              </div>
            </Card>

            {/* Dossier Batch & Kartu Sertifikasi (SKILL.md 6.12) */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-space-xs py-0.5 rounded bg-primary-container text-inverse-on-surface font-mono-code text-[11px] font-bold">
                  BATCH {currentBatch.id}
                </span>
                <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono-code text-[10px] font-bold">
                  {currentBatch.containerId}
                </span>
              </div>

              <h2 className="font-headline-md text-headline-md text-on-surface">
                {currentBatch.commodityLabel}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                <div className="bg-surface-container-low rounded p-space-xs flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Eksportir Terdaftar
                  </span>
                  <span className="font-label-md text-label-md text-on-surface mt-0.5">
                    {currentBatch.exporterName}
                  </span>
                  <span className="font-mono-code text-[10px] text-on-surface-variant">
                    {currentBatch.exporterNib}
                  </span>
                </div>
                <div className="bg-surface-container-low rounded p-space-xs flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Consignee & Pelabuhan Tujuan
                  </span>
                  <span className="font-label-md text-label-md text-on-surface mt-0.5">
                    {currentBatch.consigneeName}
                  </span>
                  <span className="font-mono-code text-[10px] text-on-surface-variant">
                    UN-LOCODE: {currentBatch.destinationPort}
                  </span>
                </div>
              </div>

              {/* 3 Kartu Sertifikasi */}
              <div className="grid grid-cols-3 gap-space-xs">
                <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[10px] text-secondary font-bold">
                      KT-12 BKHIT
                    </span>
                    <Icon name="check_circle" className="text-xs text-secondary" />
                  </div>
                  <span className="font-label-md text-[11px] text-on-surface mt-1">
                    Phytosanitary
                  </span>
                  <span className="font-mono-code text-[9px] text-on-surface-variant">
                    BKHIT-LPG-8821
                  </span>
                  <div className="mt-1.5 pt-1 border-t border-surface-container flex items-center justify-between font-mono-code text-[9px] font-bold text-secondary">
                    <span>VERIFIED</span>
                    <Icon name="description" className="text-xs" />
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[10px] text-secondary font-bold">
                      ICO FORM
                    </span>
                    <Icon name="check_circle" className="text-xs text-secondary" />
                  </div>
                  <span className="font-label-md text-[11px] text-on-surface mt-1">
                    Cert of Origin
                  </span>
                  <span className="font-mono-code text-[9px] text-on-surface-variant">
                    ICO-ID-26-881
                  </span>
                  <div className="mt-1.5 pt-1 border-t border-surface-container flex items-center justify-between font-mono-code text-[9px] font-bold text-secondary">
                    <span>ISSUED</span>
                    <Icon name="description" className="text-xs" />
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-lg p-space-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[10px] text-secondary font-bold">
                      PEB EXPORT
                    </span>
                    <Icon name="check_circle" className="text-xs text-secondary" />
                  </div>
                  <span className="font-label-md text-[11px] text-on-surface mt-1">
                    Bea Cukai NPE
                  </span>
                  <span className="font-mono-code text-[9px] text-on-surface-variant">
                    NPE-00918-KPU
                  </span>
                  <div className="mt-1.5 pt-1 border-t border-surface-container flex items-center justify-between font-mono-code text-[9px] font-bold text-secondary">
                    <span>NPE RELEASED</span>
                    <Icon name="description" className="text-xs" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalConfig.open}
        onClose={() => setModalConfig((prev) => ({ ...prev, open: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        description={modalConfig.description}
        impactWarning={modalConfig.impactWarning}
        confirmLabel={modalConfig.confirmLabel}
        variant={modalConfig.variant}
      />
    </div>
  );
}

