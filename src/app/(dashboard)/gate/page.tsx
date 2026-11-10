'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { PulseDot } from '@/components/common/PulseDot';
import { LiveClock } from '@/components/common/LiveClock';
import { Icon } from '@/components/common/Icon';
import { mockGateQueue } from '@/mocks/gateQueue';
import { mockBatches } from '@/mocks/batches';
import { GateInspectionItem, GateDecision } from '@/types';

export default function PortGateConsolePage() {
  const [queueItems, setQueueItems] = useState<GateInspectionItem[]>(mockGateQueue);
  const [selectedId, setSelectedId] = useState<string>(mockGateQueue[0].id);
  const [modalDecision, setModalDecision] = useState<{
    open: boolean;
    decision: GateDecision;
  }>({
    open: false,
    decision: 'APPROVE',
  });

  const activeItem =
    queueItems.find((item) => item.id === selectedId) || queueItems[0];
  const activeBatch =
    mockBatches[activeItem.batchId] || mockBatches['#KOP-LBG-2026-0891'];

  const isWeightAlert = activeItem.weightVariancePct > 1.5;
  const lastTemp =
    activeItem.temperatureHistory[activeItem.temperatureHistory.length - 1]?.temp || 18.2;
  const isTempAlert = lastTemp > 22.0;

  const handleExecuteDecision = (decision: GateDecision) => {
    const newStatus =
      decision === 'APPROVE'
        ? 'APPROVED'
        : decision === 'DIVERT'
        ? 'DIVERTED'
        : 'REJECTED';

    setQueueItems((prev) =>
      prev.map((q) => (q.id === activeItem.id ? { ...q, status: newStatus } : q))
    );
  };

  const decisionModalDetails = {
    APPROVE: {
      variant: 'approve' as const,
      title: 'Buka Palang Hijau (Gate Ingate)',
      description: `Anda akan menyetujui izin masuk truk ${activeItem.truckPlate} menuju dermaga muat. Pastikan barcode QR cabin (${activeItem.batchId}) dan segel elektronik RFID telah terverifikasi.`,
      impactWarning: `Dampak Operasional: Palang hidrolik ${activeItem.assignedLane} akan terbuka selama 45 detik. Slot waktu dermaga akan dikunci di TOS Pelindo.`,
      confirmLabel: 'Buka Palang Hijau (Approve)',
    },
    DIVERT: {
      variant: 'divert' as const,
      title: 'Alihkan Armada ke Buffer Holding / Timbang Ulang',
      description: `Anda akan mengalihkan truk ${activeItem.truckPlate} dari jalur ingate utama menuju area tunggu Buffer Holding KM 42 atau jalur pemeriksaan fisik Barantin.`,
      impactWarning:
        'Dampak Operasional: Tiket oranye pengalihan dicetak otomatis dan instruksi rute koreksi dikirim ke konsol pengemudi.',
      confirmLabel: 'Alihkan Armada (Divert)',
    },
    REJECT: {
      variant: 'reject' as const,
      title: 'Tolak Masuk & Bekukan Manifest Ekspor',
      description: `Truk ${activeItem.truckPlate} mengalami anomali kritis (suhu ${lastTemp.toFixed(1)}°C / variansi timbangan ${activeItem.weightVariancePct}%). Penolakan akan membekukan manifest ekspor sementara.`,
      impactWarning:
        'Dampak Operasional: Palang gerbang dikunci (LOCKDOWN), notifikasi darurat dikirim ke Barantin & INSW.',
      confirmLabel: 'Tolak Masuk (Reject)',
    },
  }[modalDecision.decision];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Console Header (SKILL.md 6.2) */}
      <div className="w-full bg-surface-container-low px-margin py-space-md shadow-sm flex flex-wrap items-center justify-between gap-gutter border-b border-surface-container-high/50">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <Icon name="dock" className="text-2xl text-secondary-fixed" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-sm text-headline-sm text-on-surface">
                Port Gate & Quarantine Inspection Console
              </h1>
              <span className="px-space-xs py-0.5 rounded bg-secondary text-on-secondary font-mono-code text-[10px] font-bold uppercase tracking-wider">
                ALPR & BARANTIN INGATE
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono-code text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Icon name="badge" className="text-xs text-secondary" />
                Petugas: <strong className="text-on-surface">Ir. Hendra Wijaya, S.T.</strong> (NIP 198503142010011008)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="verified_user" className="text-xs text-secondary" />
                Instansi: <strong className="text-on-surface">BKHIT Barantin & Pelindo Regional 2</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right 3-Column White Panel */}
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
              Giliran Shift
            </span>
            <span className="font-mono-code text-xs font-bold text-on-surface">
              Shift II • Gate 1–3
            </span>
          </div>
          <div className="w-px h-8 bg-surface-container" />
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
              Ingate Hari Ini
            </span>
            <span className="font-mono-metric text-sm font-bold text-secondary">
              142 TEU
            </span>
          </div>
        </div>
      </div>

      {/* 2. Content Container */}
      <div className="w-full p-margin flex flex-col gap-space-lg">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
          <KpiCard
            title="Gate Throughput"
            metric="34.2"
            unit="TEU / HOUR"
            badgeText="Cycle 4.2m/truk"
            badgeVariant="positive"
            variant="sparkline"
            sparklineData={[28, 30, 31, 33, 32, 34, 34.2]}
          />
          <KpiCard
            title="Buffer Zone Occupancy"
            metric="70.8%"
            unit="KM 42 STAGING"
            badgeText="Normal Capacity"
            badgeVariant="positive"
            variant="progress"
            progressPct={71}
          />
          <KpiCard
            title="Weighbridge Variance"
            metric={`${activeItem.weightVariancePct}%`}
            unit={`${activeItem.weighbridgeGrossKg.toLocaleString()} KG`}
            badgeText={isWeightAlert ? 'EXCEEDS ±1.5%' : 'TOLERANCE OK'}
            badgeVariant={isWeightAlert ? 'critical' : 'positive'}
            variant="mini-grid"
            miniStats={[
              { label: 'Net Cargo', value: `${activeItem.weighbridgeNetKg.toLocaleString()} KG` },
              { label: 'Batas Toleransi', value: '±1.50%' },
            ]}
          />
          <KpiCard
            title="Status Inspeksi Aktif"
            metric={activeItem.truckPlate}
            unit={activeItem.status}
            badgeText={activeItem.priorityStatus}
            badgeVariant={isTempAlert || isWeightAlert ? 'critical' : 'positive'}
            variant="mini-grid"
            miniStats={[
              { label: 'ALPR Confidence', value: `${activeItem.ocrConfidence}%` },
              { label: 'E-Seal RFID', value: activeItem.eSealIntegrity },
            ]}
          />
        </div>

        {/* Main Split: Left ALPR, Decision Matrix & EUDR (7 cols), Right Virtual Gate Queue & Dossier (5 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
          {/* Left Column (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-space-md">
            {/* ALPR Camera & Scanner Panel (SKILL.md 6.11) */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-space-xs border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <Icon name="qr_code_scanner" className="text-lg text-secondary" />
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    ALPR Optical Gate & Sensor Verification
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={activeItem.assignedLane} variant="active" />
                  <StatusBadge
                    label={
                      activeItem.status === 'APPROVED'
                        ? 'Hydraulic Barrier: OPEN (45s)'
                        : activeItem.status === 'REJECTED'
                        ? 'Hydraulic Barrier: LOCKED DOWN'
                        : 'Hydraulic Barrier: STANDBY'
                    }
                    variant={
                      activeItem.status === 'APPROVED'
                        ? 'ok'
                        : activeItem.status === 'REJECTED'
                        ? 'critical'
                        : 'neutral'
                    }
                    pill
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                {/* Main ALPR Camera Feed (2 cols) */}
                <div className="md:col-span-2 relative h-56 rounded-lg overflow-hidden bg-primary-container flex flex-col justify-between p-space-sm select-none">
                  {/* Simulated Camera Grid & Truck Silhouette */}
                  <svg
                    viewBox="0 0 400 200"
                    className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
                  >
                    <defs>
                      <pattern id="cam-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                        <path
                          d="M 25 0 L 0 0 0 25"
                          fill="none"
                          stroke="#89f5e7"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect width="400" height="200" fill="url(#cam-grid)" />
                    {/* Targeting Reticle */}
                    <rect
                      x="95"
                      y="45"
                      width="210"
                      height="105"
                      fill="none"
                      stroke="#4edea3"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                  </svg>

                  {/* Top HUD */}
                  <div className="relative z-10 flex items-center justify-between font-mono-code text-[10px] text-surface-bright">
                    <div className="flex items-center gap-1.5 bg-surface-container-lowest/15 px-2 py-0.5 rounded">
                      <PulseDot color="error" mode="ping" size="sm" />
                      <span className="font-bold">REC // CH-01 INGATE</span>
                    </div>
                    <span className="bg-surface-container-lowest/15 px-2 py-0.5 rounded text-secondary-fixed">
                      FOV 112° • ISO 200 • 60FPS
                    </span>
                  </div>

                  {/* Center License Plate Recognition Box */}
                  <div className="relative z-10 my-auto mx-auto flex flex-col items-center gap-1">
                    <span className="font-mono-code text-[9px] uppercase tracking-widest text-secondary-fixed">
                      ALPR BOUNDING BOX LOCKED
                    </span>
                    <div className="bg-surface-container-lowest text-primary font-mono-metric text-2xl font-bold px-4 py-1.5 rounded shadow-lg border-2 border-secondary-fixed tracking-wider">
                      {activeItem.truckPlate}
                    </div>
                  </div>

                  {/* Bottom HUD */}
                  <div className="relative z-10 flex items-center justify-between bg-primary-container/80 backdrop-blur-xs px-space-xs py-1 rounded">
                    <div className="flex items-center gap-2 font-mono-code text-[11px] text-surface-bright">
                      <span>OCR CONFIDENCE:</span>
                      <span className="text-secondary-fixed font-bold">
                        {activeItem.ocrConfidence}%
                      </span>
                    </div>
                    <StatusBadge
                      label={activeItem.alprMatch ? 'PLATE MATCHED' : 'MISMATCH'}
                      variant={activeItem.alprMatch ? 'ok' : 'critical'}
                    />
                  </div>
                </div>

                {/* Right QR Pass Scanner Box (1 col) */}
                <div className="relative h-56 rounded-lg overflow-hidden bg-primary-container p-space-sm flex flex-col items-center justify-between text-center select-none">
                  <div className="w-full flex items-center justify-between font-mono-code text-[10px] text-on-primary-container">
                    <span>OPTICAL QR</span>
                    <span className="text-secondary-fixed font-bold">ED25519</span>
                  </div>

                  <div className="w-24 h-24 rounded-xl bg-surface-container-lowest/10 flex items-center justify-center border border-secondary-fixed/40">
                    <Icon name="qr_code_2" className="text-6xl text-secondary-fixed" />
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    <span className="font-mono-code text-xs font-bold text-surface-bright">
                      PASS-2026-{activeItem.id}
                    </span>
                    <span className="font-mono-code text-[10px] text-on-primary-container">
                      {activeItem.driverName}
                    </span>
                    <div className="mt-1 py-0.5 px-2 rounded bg-secondary-container text-on-secondary-container font-mono-code text-[10px] font-bold">
                      VALID DRIVER TOKEN
                    </div>
                  </div>
                </div>
              </div>

              {/* 2 Sensor Badges Below Camera (E-Seal RFID & Weighbridge) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                      <Icon name="nfc" className="text-xl" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                        E-Seal RFID Reader (433 MHz)
                      </span>
                      <span className="font-mono-data text-mono-data font-bold text-on-surface">
                        SEAL-DIGI-992{activeItem.queueNumber} • {activeItem.eSealIntegrity}
                      </span>
                    </div>
                  </div>
                  <StatusBadge
                    label={activeItem.eSealIntegrity === 'SECURE' ? 'INTACT' : 'TAMPERED'}
                    variant={activeItem.eSealIntegrity === 'SECURE' ? 'ok' : 'critical'}
                  />
                </div>

                <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                      <Icon name="scale" className="text-xl" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                        Jembatan Timbang (Gross / Net)
                      </span>
                      <span className="font-mono-data text-mono-data font-bold text-on-surface">
                        {activeItem.weighbridgeGrossKg.toLocaleString()} KG / Net{' '}
                        {activeItem.weighbridgeNetKg.toLocaleString()} KG
                      </span>
                    </div>
                  </div>
                  <StatusBadge
                    label={`Δ ${activeItem.weightVariancePct}%`}
                    variant={isWeightAlert ? 'critical' : 'ok'}
                  />
                </div>
              </div>
            </Card>

            {/* 3-Way Decision Matrix (SKILL.md 6.6) */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  3-Way Gate Decision Matrix — Eksekusi Otoritas Gerbang
                </span>
                <span className="font-mono-code text-[11px] text-on-surface-variant">
                  Target: <strong>{activeItem.truckPlate}</strong> ({activeItem.status})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                {/* 1. Approve */}
                <button
                  type="button"
                  onClick={() => setModalDecision({ open: true, decision: 'APPROVE' })}
                  className="group flex flex-col items-center p-space-md rounded-xl bg-secondary text-on-secondary active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-on-secondary/15 flex items-center justify-center mb-2">
                    <Icon
                      name="check_circle"
                      className="text-2xl group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="font-mono-code text-xs font-bold uppercase tracking-wider">
                    APPROVE INGATE
                  </span>
                  <span className="font-body-sm text-body-sm opacity-90 mt-0.5">
                    Buka Palang Hijau
                  </span>
                  <span className="mt-2 px-2 py-0.5 rounded bg-on-secondary/15 font-mono-code text-[10px]">
                    Fast-Track Lane 3
                  </span>
                </button>

                {/* 2. Divert */}
                <button
                  type="button"
                  onClick={() => setModalDecision({ open: true, decision: 'DIVERT' })}
                  className="group flex flex-col items-center p-space-md rounded-xl bg-surface-container-high text-on-surface active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-2">
                    <Icon
                      name="alt_route"
                      className="text-2xl group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="font-mono-code text-xs font-bold uppercase tracking-wider">
                    DIVERT STAGING
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Alihkan ke Buffer KM 42
                  </span>
                  <span className="mt-2 px-2 py-0.5 rounded bg-surface-container-lowest font-mono-code text-[10px] text-secondary font-bold">
                    Timbang / Cek Ulang
                  </span>
                </button>

                {/* 3. Reject */}
                <button
                  type="button"
                  onClick={() => setModalDecision({ open: true, decision: 'REJECT' })}
                  className="group flex flex-col items-center p-space-md rounded-xl bg-error-container text-on-error-container active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center mb-2">
                    <Icon
                      name="block"
                      className="text-2xl group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="font-mono-code text-xs font-bold uppercase tracking-wider">
                    REJECT & HOLD
                  </span>
                  <span className="font-body-sm text-body-sm opacity-90 mt-0.5">
                    Tolak & Kunci Manifest
                  </span>
                  <span className="mt-2 px-2 py-0.5 rounded bg-error text-on-error font-mono-code text-[10px]">
                    Karantina Barantin
                  </span>
                </button>
              </div>
            </Card>

            {/* EUDR Compliance Card (SKILL.md 6.13) */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-space-xs border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <Icon name="nature_people" className="text-lg text-secondary" />
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-bold">
                    EUDR Compliance Engine (EU Reg 2023/1115)
                  </span>
                </div>
                <StatusBadge
                  label={
                    activeBatch.eudrStatus === 'VERIFIED'
                      ? 'ZERO DEFORESTATION VERIFIED'
                      : 'UNDER GEOSPATIAL REVIEW'
                  }
                  variant={activeBatch.eudrStatus === 'VERIFIED' ? 'ok' : 'warning'}
                  pill
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
                {/* Polygon Map Preview (5 cols) */}
                <div className="md:col-span-5 h-36 rounded-lg bg-primary-container relative overflow-hidden p-space-sm flex flex-col justify-between text-surface-bright">
                  <svg
                    viewBox="0 0 200 120"
                    className="absolute inset-0 w-full h-full opacity-80"
                  >
                    <polygon
                      points="45,25 145,20 165,85 60,95"
                      fill="rgba(111, 251, 190, 0.25)"
                      stroke="#6ffbbe"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    <circle cx="95" cy="58" r="4" fill="#89f5e7" />
                  </svg>
                  <span className="relative z-10 font-mono-code text-[10px] text-secondary-fixed bg-primary-container/80 px-1.5 py-0.5 rounded self-start">
                    Centroid: {activeBatch.centroidCoordinates[0]}, {activeBatch.centroidCoordinates[1]}
                  </span>
                  <span className="relative z-10 font-mono-code text-[10px] bg-primary-container/90 px-2 py-0.5 rounded text-tertiary-fixed font-bold">
                    Polygon Match: KLHK 2020 — 100% OK
                  </span>
                </div>

                {/* Right Audit Details (7 cols) */}
                <div className="md:col-span-7 flex flex-col gap-space-xs">
                  <div className="grid grid-cols-2 gap-space-xs font-mono-code text-[11px]">
                    <div className="bg-surface-container-low p-space-xs rounded">
                      <span className="text-on-surface-variant block text-[9px] uppercase">
                        Sentinel-2 & PostGIS
                      </span>
                      <span className="font-bold text-secondary">Deforestasi: 0.00 Ha</span>
                    </div>
                    <div className="bg-surface-container-low p-space-xs rounded">
                      <span className="text-on-surface-variant block text-[9px] uppercase">
                        Buffer Hutan Lindung TNBBS
                      </span>
                      <span className="font-bold text-on-surface">+4.82 km (Aman)</span>
                    </div>
                    <div className="bg-surface-container-low p-space-xs rounded">
                      <span className="text-on-surface-variant block text-[9px] uppercase">
                        Asal Distrik Panen
                      </span>
                      <span className="font-bold text-on-surface">{activeBatch.originDistrict}</span>
                    </div>
                    <div className="bg-surface-container-low p-space-xs rounded">
                      <span className="text-on-surface-variant block text-[9px] uppercase">
                        DDS Reference
                      </span>
                      <span className="font-bold text-on-surface">{activeBatch.ddsId}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 font-mono-code text-[10px]">
                    <span className="text-on-surface-variant truncate max-w-[260px]">
                      SHA: {activeBatch.postGisStateHash}
                    </span>
                    <Link
                      href={`/eudr/${activeBatch.id.replace('#', '')}`}
                      className="text-secondary font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>Inspect Coordinates</span>
                      <Icon name="open_in_new" className="text-xs" />
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Virtual Gate Queue & Dossier (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-space-md">
            {/* Virtual Gate Queue (SKILL.md 6.9) */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
                <div className="flex items-center gap-2">
                  <Icon name="schedule" className="text-lg text-secondary" />
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Antrian Virtual Gate (Klik untuk Inspeksi)
                  </span>
                </div>
                <StatusBadge label="LIVE QUEUE" variant="live" dot />
              </div>

              <div className="flex flex-col gap-space-xs">
                {queueItems.map((item) => {
                  const isSelected = item.id === activeItem.id;
                  const isHold = item.priorityStatus === 'Audit Hold' || item.status === 'REJECTED';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`p-space-sm rounded-lg transition-all cursor-pointer flex items-center justify-between gap-space-sm ${
                        isSelected
                          ? 'bg-surface-container-high shadow-xs ring-1 ring-secondary'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-space-sm">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono-code text-xs font-bold shrink-0 ${
                            isHold
                              ? 'bg-error-container text-error'
                              : item.queueNumber === 1
                              ? 'bg-secondary text-on-secondary'
                              : 'bg-primary-container text-surface-bright'
                          }`}
                        >
                          {item.queueNumber}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-code text-xs font-bold text-on-surface">
                              {item.truckPlate}
                            </span>
                            <StatusBadge
                              label={item.status}
                              variant={
                                item.status === 'APPROVED'
                                  ? 'ok'
                                  : item.status === 'REJECTED'
                                  ? 'critical'
                                  : item.status === 'DIVERTED'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            />
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {item.commodity}
                          </span>
                          <span
                            className={`font-mono-code text-[10px] font-semibold ${
                              isHold ? 'text-error' : 'text-secondary'
                            }`}
                          >
                            {item.assignedLane}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-mono-code text-xs font-bold text-on-surface">
                          {item.timeSlot}
                        </span>
                        <span
                          className={`font-mono-code text-[10px] font-semibold ${
                            isHold ? 'text-error' : 'text-on-surface-variant'
                          }`}
                        >
                          {item.priorityStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-space-xs border-t border-surface-container flex items-center justify-between font-mono-code text-[11px] text-on-surface-variant">
                <span>
                  Buffer Occupancy: <strong className="text-on-surface">70.8%</strong>
                </span>
                <span>
                  Gate Cycle: <strong className="text-secondary">4.2 min/truk</strong>
                </span>
              </div>
            </Card>

            {/* Dossier Batch & Kartu Sertifikasi (SKILL.md 6.12) */}
            <Card variant="surface" className="p-space-md flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-space-xs py-0.5 rounded bg-primary-container text-inverse-on-surface font-mono-code text-[11px] font-bold">
                  BATCH {activeBatch.id}
                </span>
                <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono-code text-[10px] font-bold">
                  {activeBatch.containerId}
                </span>
              </div>

              <h2 className="font-headline-md text-headline-md text-on-surface">
                {activeBatch.commodityLabel}
              </h2>

              <div className="grid grid-cols-1 gap-space-xs">
                <div className="bg-surface-container-low rounded p-space-xs flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Eksportir Terdaftar
                  </span>
                  <span className="font-label-md text-label-md text-on-surface mt-0.5">
                    {activeBatch.exporterName}
                  </span>
                  <span className="font-mono-code text-[10px] text-on-surface-variant">
                    {activeBatch.exporterNib}
                  </span>
                </div>
                <div className="bg-surface-container-low rounded p-space-xs flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Consignee & Pelabuhan Tujuan
                  </span>
                  <span className="font-label-md text-label-md text-on-surface mt-0.5">
                    {activeBatch.consigneeName}
                  </span>
                  <span className="font-mono-code text-[10px] text-on-surface-variant">
                    UN-LOCODE: {activeBatch.destinationPort}
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalDecision.open}
        onClose={() => setModalDecision((prev) => ({ ...prev, open: false }))}
        onConfirm={() => handleExecuteDecision(modalDecision.decision)}
        variant={decisionModalDetails.variant}
        title={decisionModalDetails.title}
        subtitle={`ARMADA ${activeItem.truckPlate} • BATCH ${activeItem.batchId}`}
        description={decisionModalDetails.description}
        impactWarning={decisionModalDetails.impactWarning}
        confirmLabel={decisionModalDetails.confirmLabel}
      />
    </div>
  );
}

