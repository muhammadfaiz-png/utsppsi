'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { PulseDot } from '@/components/common/PulseDot';
import { Icon } from '@/components/common/Icon';
import { mockBatches } from '@/mocks/batches';

export default function EudrPassportPage() {
  const params = useParams();
  const rawBatchId = typeof params?.batchId === 'string' ? decodeURIComponent(params.batchId) : 'KOP-LBG-2026-0891';
  const normalizedKey = rawBatchId.startsWith('#') ? rawBatchId : `#${rawBatchId}`;

  const batchKeys = Object.keys(mockBatches);
  const currentBatch =
    mockBatches[normalizedKey] || mockBatches['#KOP-LBG-2026-0891'];

  const [hashVerified, setHashVerified] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'dds' | 'geojson' | 'verify'>('verify');

  const isVerified = currentBatch.eudrStatus === 'VERIFIED';

  const auditRows = [
    {
      param: 'Deforestation Cut-off Audit (31 Dec 2020)',
      standard: 'EU Reg 2023/1115 Art. 3(a)',
      observation: 'Sentinel-2 L2A NDVI & Hansen Global Forest Change: 0.00 Ha kehilangan tutupan hutan',
      state: 'COMPLIANT (100%)',
    },
    {
      param: 'Protected Forest Buffer (TNBBS & Register)',
      standard: 'Peta Kawasan Hutan KLHK RI',
      observation: `Jarak aman +4.82 km di luar batas Taman Nasional Bukit Barisan Selatan (${currentBatch.originDistrict})`,
      state: 'VERIFIED SAFE',
    },
    {
      param: 'Geolocation Polygon Precision (EPSG:4326)',
      standard: 'EUDR Art. 9(1)(d) > 4 Ha Polygon',
      observation: `5 titik verteks GPS terkunci (${currentBatch.centroidCoordinates[0]}, ${currentBatch.centroidCoordinates[1]})`,
      state: isVerified ? 'POLYGON LOCKED' : 'REVIEWING VERTEX',
    },
    {
      param: 'Smallholder Legal Tenure & Koperasi Registry',
      standard: 'STDB Perkebunan & NIB OSS',
      observation: `Terdaftar atas ${currentBatch.exporterName} (${currentBatch.exporterNib})`,
      state: 'LEGALLY VALID',
    },
    {
      param: 'Cold-Chain & Phytosanitary Quarantine',
      standard: 'UU No. 21/2019 Barantin KT-12',
      observation: `Suhu transit terkendali 18.2°C • Kontainer ${currentBatch.containerId}`,
      state: 'KT-12 ISSUED',
    },
  ];

  const provenanceSteps = [
    {
      step: '01. Panen Kebun Rakyat & Geotagging Poligon',
      time: currentBatch.harvestWindow,
      desc: `Pemetikan selektif komoditas ${currentBatch.commodityLabel} di ${currentBatch.originDistrict}. Koordinat poligon lahan petani direkam menggunakan GPS geodetik dan divalidasi terhadap peta tutupan hutan KLHK 2020.`,
      proof: `Centroid: ${currentBatch.centroidCoordinates[0]}, ${currentBatch.centroidCoordinates[1]} • 142 Petani Mitra`,
      icon: 'forest',
      done: true,
    },
    {
      step: '02. Sortasi Koperasi, Uji Mutu SCA & Penerbitan Paspor',
      time: '02 Juli 2026 • 08:30 WIB',
      desc: `Pengolahan pascapanen, uji kadar air (${currentBatch.moisturePct}%), cupping score (${currentBatch.scaScore}), dan pengemasan ke dalam kontainer ${currentBatch.containerId} dengan segel elektronik RFID.`,
      proof: `DDS Reference: ${currentBatch.ddsId} • Eksportir: ${currentBatch.exporterName}`,
      icon: 'precision_manufacturing',
      done: true,
    },
    {
      step: '03. Transit Koridor JTTS & Pemantauan IoT Cold-Chain',
      time: '10 Nov 2026 • 14:00 – 16:30 WIB',
      desc: 'Pengiriman dari gudang konsolidasi menuju Pelabuhan Panjang melalui Tol Bakauheni–Terbanggi Besar (JTTS) dan Bypass Soekarno-Hatta dengan telemetri suhu MQTT tiap 10 detik.',
      proof: `Cold-Chain Index: ${currentBatch.coldChainIndex}% • Zero Deforestation & Zero Seal Tamper`,
      icon: 'local_shipping',
      done: true,
    },
    {
      step: '04. Inspeksi Gerbang Pelindo Panjang & Pemuatan Kapal Ekspor',
      time: '11 Nov 2026 • ETA 04:00 WIB',
      desc: `Verifikasi ALPR, Jembatan Timbang (${currentBatch.weightKg.toLocaleString()} KG), pelepasan NPE Bea Cukai, dan pemuatan di Dermaga Pelabuhan Panjang menuju ${currentBatch.destinationPort}.`,
      proof: `Consignee: ${currentBatch.consigneeName} • Status: READY FOR VESSEL LOAD`,
      icon: 'directions_boat',
      done: false,
    },
  ];

  const handleDownloadAction = () => {
    if (modalAction === 'verify') {
      setHashVerified(true);
    } else if (modalAction === 'geojson') {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              batchId: currentBatch.id,
              ddsId: currentBatch.ddsId,
              commodity: currentBatch.commodityLabel,
              exporter: currentBatch.exporterName,
              eudrStatus: currentBatch.eudrStatus,
              postGisStateHash: currentBatch.postGisStateHash,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [
                (
                  currentBatch.polygonCoordinates || [
                    [-5.318, 104.594],
                    [-5.319, 104.603],
                    [-5.325, 104.605],
                    [-5.326, 104.596],
                    [-5.318, 104.594],
                  ]
                ).map(([lat, lng]) => [lng, lat]),
              ],
            },
          },
        ],
      };
      const blob = new Blob([JSON.stringify(geojson, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EUDR_${currentBatch.id.replace('#', '')}.geojson`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Cryptographic Sync Banner (SKILL.md 6.16) */}
      <div className="bg-primary-container text-on-primary-container py-space-sm px-margin shadow-md flex flex-wrap items-center justify-between gap-gutter select-none">
        <div className="flex flex-wrap items-center gap-space-sm font-mono-code text-[11px]">
          <span className="flex items-center gap-1.5 text-secondary-fixed font-bold">
            <PulseDot color="secondary-fixed" mode="ping" size="sm" />
            POSTGIS GEODATA SYNC: OK
          </span>
          <span className="text-on-primary-container/40">|</span>
          <span className="text-surface-bright">
            EU REGULATION (EU) 2023/1115 READY
          </span>
          <span className="hidden md:inline text-on-primary-container/40">|</span>
          <span className="hidden md:inline text-tertiary-fixed">
            BLOCK HASH: {currentBatch.postGisStateHash.slice(0, 14)}...
            {currentBatch.postGisStateHash.slice(-6)}
          </span>
        </div>

        {/* Batch Switcher Pills */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono-code text-[10px] text-on-primary-container uppercase mr-1">
            Pilih Batch:
          </span>
          {batchKeys.map((key) => {
            const cleanSlug = key.replace('#', '');
            const active = key === currentBatch.id;
            return (
              <Link
                key={key}
                href={`/eudr/${cleanSlug}`}
                className={`px-2 py-0.5 rounded font-mono-code text-[10px] font-bold transition-colors ${
                  active
                    ? 'bg-secondary-fixed text-on-secondary-fixed'
                    : 'bg-surface-container-lowest/15 text-surface-bright hover:bg-surface-container-lowest/25'
                }`}
              >
                {key}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-6xl mx-auto p-margin flex flex-col gap-space-lg">
        {/* 1. Hero Passport Section (SKILL.md 6.16) */}
        <Card variant="surface" className="p-space-lg md:p-space-xl shadow-md flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container text-tertiary-fixed font-mono-code text-[11px] font-bold flex items-center gap-1.5">
                  <Icon name="verified" className="text-xs" />
                  EUDR 100% Compliant • Zero Deforestation
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-mono-code text-[11px] font-bold">
                  DDS: {currentBatch.ddsId}
                </span>
                {hashVerified && (
                  <StatusBadge label="SHA-256 SIGNATURE VERIFIED" variant="ok" pill />
                )}
              </div>

              <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1">
                Digital Commodity Passport
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-metric text-mono-metric text-secondary font-bold">
                  {currentBatch.id}
                </span>
                <span className="text-on-surface-variant">•</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  {currentBatch.commodityLabel}
                </span>
              </div>
            </div>

            {/* Right Audit Timestamp Box */}
            <div className="bg-surface-container-low rounded-xl p-space-sm border border-surface-container-high flex flex-col min-w-[220px]">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Audit Timestamp & Ledger
              </span>
              <span className="font-mono-data text-mono-data font-bold text-on-surface mt-0.5">
                10 Nov 2026 • 16:30 WIB
              </span>
              <span className="font-mono-code text-[10px] text-secondary font-semibold mt-0.5">
                PostGIS 3.4 Spatial Node Verified
              </span>
            </div>
          </div>

          {/* 4 Summary Cells */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
            <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Batch Payload
              </span>
              <span className="font-mono-metric text-lg font-bold text-on-surface mt-0.5">
                {currentBatch.weightKg.toLocaleString()} KG
              </span>
              <span className="font-mono-code text-[10px] text-on-surface-variant">
                {currentBatch.containerId}
              </span>
            </div>

            <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Protected Origin
              </span>
              <span className="font-label-md text-sm font-bold text-on-surface mt-0.5">
                {currentBatch.originDistrict}
              </span>
              <span className="font-mono-code text-[10px] text-secondary font-semibold">
                {currentBatch.centroidCoordinates[0]}, {currentBatch.centroidCoordinates[1]}
              </span>
            </div>

            <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Harvest Window
              </span>
              <span className="font-label-md text-sm font-bold text-on-surface mt-0.5">
                {currentBatch.harvestWindow}
              </span>
              <span className="font-mono-code text-[10px] text-on-surface-variant">
                Cut-off 31 Des 2020: LULUS
              </span>
            </div>

            <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Export Maritime Leg
              </span>
              <span className="font-label-md text-sm font-bold text-on-surface mt-0.5">
                Panjang → {currentBatch.destinationPort.split(' ')[0]}
              </span>
              <span className="font-mono-code text-[10px] text-on-surface-variant">
                {currentBatch.consigneeName}
              </span>
            </div>
          </div>

          {/* 3 Action Buttons */}
          <div className="flex flex-wrap items-center gap-space-sm pt-space-xs border-t border-surface-container">
            <Button
              variant="primary"
              icon="picture_as_pdf"
              onClick={() => {
                setModalAction('dds');
                setModalOpen(true);
              }}
            >
              Download Due Diligence Statement (DDS)
            </Button>
            <Button
              variant="secondary"
              icon="download"
              onClick={() => {
                setModalAction('geojson');
                setModalOpen(true);
              }}
            >
              Export Polygon GeoJSON (EPSG:4326)
            </Button>
            <Button
              variant="dispatch"
              icon="shield"
              onClick={() => {
                setModalAction('verify');
                setModalOpen(true);
              }}
            >
              {hashVerified ? 'Cryptographic Hash Terverifikasi ✓' : 'Re-verify PostGIS SHA-256 Hash'}
            </Button>
          </div>
        </Card>

        {/* 2. Geofence Polygon Map & Audit Table Section */}
        <Card variant="surface" className="p-space-lg shadow-md flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold block">
                SATELLITE & POSTGIS GEOSPATIAL AUDIT
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Peta Poligon Kebun Asal & Tabel Kepatuhan EUDR
              </h2>
            </div>
            <StatusBadge label="SENTINEL-2 L2A MULTISPECTRAL" variant="ok" />
          </div>

          {/* Dark Satellite Geofence Canvas */}
          <div className="relative min-h-[320px] rounded-xl bg-primary-container overflow-hidden p-space-md flex flex-col justify-between text-surface-bright shadow-lg select-none">
            <svg
              viewBox="0 0 800 320"
              className="absolute inset-0 w-full h-full opacity-90 pointer-events-none"
            >
              <defs>
                <pattern id="eudr-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#6bd8cb"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                </pattern>
              </defs>
              <rect width="800" height="320" fill="#0c1626" />
              <rect width="800" height="320" fill="url(#eudr-grid)" />

              {/* Protected Forest Boundary TNBBS on Left */}
              <polygon
                points="0,0 190,0 150,320 0,320"
                fill="#002113"
                opacity="0.7"
                stroke="#4edea3"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text x="20" y="40" fill="#6ffbbe" fontSize="11" fontFamily="monospace" fontWeight="bold">
                ZONA HUTAN LINDUNG TNBBS (KLHK)
              </text>

              {/* Buffer Distance Line */}
              <line
                x1="175"
                y1="160"
                x2="330"
                y2="160"
                stroke="#89f5e7"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text x="205" y="150" fill="#89f5e7" fontSize="10" fontFamily="monospace">
                Buffer +4.82 km (Aman)
              </text>

              {/* Verified Farm Polygon */}
              <polygon
                points="330,85 560,70 610,210 370,245"
                fill="rgba(111, 251, 190, 0.25)"
                stroke="#6ffbbe"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
              {/* Polygon Vertices */}
              <circle cx="330" cy="85" r="5" fill="#6ffbbe" stroke="#006a61" strokeWidth="2" />
              <circle cx="560" cy="70" r="5" fill="#6ffbbe" stroke="#006a61" strokeWidth="2" />
              <circle cx="610" cy="210" r="5" fill="#6ffbbe" stroke="#006a61" strokeWidth="2" />
              <circle cx="370" cy="245" r="5" fill="#6ffbbe" stroke="#006a61" strokeWidth="2" />
              <circle cx="470" cy="155" r="6" fill="#89f5e7" />
              <text x="410" y="140" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="bold">
                PLOT {currentBatch.id}
              </text>
              <text x="410" y="175" fill="#6ffbbe" fontSize="10" fontFamily="monospace">
                NDVI: 0.78 (Kebun Agroforestri Aktif)
              </text>
            </svg>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
              <span className="bg-primary-container/90 px-2.5 py-1 rounded font-mono-code text-xs text-secondary-fixed font-bold">
                PROJ: EPSG:4326 • WGS84 • {currentBatch.originDistrict}
              </span>
              <span className="bg-primary-container/90 px-2.5 py-1 rounded font-mono-code text-xs text-tertiary-fixed font-bold">
                KLHK 2020 Baseline Overlap: 0.00 Ha
              </span>
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-primary-container/90 p-space-xs rounded-lg font-mono-code text-[11px]">
              <span>
                Centroid: LAT {currentBatch.centroidCoordinates[0]} / LON{' '}
                {currentBatch.centroidCoordinates[1]}
              </span>
              <span className="text-secondary-fixed">
                ST_IsValid(geom) = TRUE • Area: 18.42 Ha (Koperasi Kolektif)
              </span>
            </div>
          </div>

          {/* Regulatory Compliance Audit Table */}
          <div className="bg-surface-container-low rounded-lg p-space-sm overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-label-md text-label-md">
                  <th className="py-space-xs px-space-sm">Audit Parameter</th>
                  <th className="py-space-xs px-space-sm">Regulatory Standard</th>
                  <th className="py-space-xs px-space-sm">Verified Observation</th>
                  <th className="py-space-xs px-space-sm text-right">Compliance State</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-surface-container transition-colors"
                  >
                    <td className="py-space-sm px-space-sm font-semibold text-on-surface">
                      {row.param}
                    </td>
                    <td className="py-space-sm px-space-sm font-mono-code text-[11px] text-on-surface-variant">
                      {row.standard}
                    </td>
                    <td className="py-space-sm px-space-sm text-on-surface-variant">
                      {row.observation}
                    </td>
                    <td className="py-space-sm px-space-sm text-right font-mono-code text-[11px] font-bold text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="check_circle" className="text-xs text-secondary" />
                        {row.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 3. Metric Tiles (4 Columns) (SKILL.md 6.16) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <Card variant="surface" className="p-space-lg shadow-md flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Moisture Content
              </span>
              <Icon name="water_drop" className="text-xl text-secondary" />
            </div>
            <span className="font-mono-metric text-2xl font-bold text-on-surface">
              {currentBatch.moisturePct ?? 11.8}%
            </span>
            <span className="font-body-sm text-xs text-secondary font-medium">
              SNI 01-2907-2008 Grade 1 (&lt;12.5%)
            </span>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
              <div className="h-full bg-secondary rounded-full" style={{ width: '88%' }} />
            </div>
          </Card>

          <Card variant="surface" className="p-space-lg shadow-md flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                SCA Cupping Score
              </span>
              <Icon name="award_star" className="text-xl text-secondary" />
            </div>
            <span className="font-mono-metric text-2xl font-bold text-on-surface">
              {currentBatch.scaScore ?? 84.5} / 100
            </span>
            <span className="font-body-sm text-xs text-secondary font-medium">
              Fine Robusta Specialty Verified
            </span>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
              <div className="h-full bg-secondary rounded-full" style={{ width: '85%' }} />
            </div>
          </Card>

          <Card variant="surface" className="p-space-lg shadow-md flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Cold-Chain Index
              </span>
              <Icon name="thermostat" className="text-xl text-secondary" />
            </div>
            <span className="font-mono-metric text-2xl font-bold text-on-surface">
              {currentBatch.coldChainIndex ?? 99.8}%
            </span>
            <span className="font-body-sm text-xs text-secondary font-medium">
              Stabilitas Transit Koridor JTTS
            </span>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
              <div className="h-full bg-secondary rounded-full" style={{ width: '99%' }} />
            </div>
          </Card>

          <Card variant="surface" className="p-space-lg shadow-md flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Carbon Footprint
              </span>
              <Icon name="eco" className="text-xl text-secondary" />
            </div>
            <span className="font-mono-metric text-2xl font-bold text-on-surface">
              {currentBatch.carbonKgCo2e ?? 1.42} kg CO₂e
            </span>
            <span className="font-body-sm text-xs text-secondary font-medium">
              Low-Emission Agroforestry Plot
            </span>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
              <div className="h-full bg-secondary rounded-full" style={{ width: '92%' }} />
            </div>
          </Card>
        </div>

        {/* 4. Provenance Timeline (SKILL.md 6.16) */}
        <Card variant="surface" className="p-space-lg shadow-md flex flex-col gap-space-lg">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold block">
              END-TO-END SUPPLY CHAIN PROVENANCE
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Jejak Rantai Pasok dari Kebun Rakyat ke Dermaga Ekspor
            </h2>
          </div>

          <div className="relative flex flex-col gap-space-md before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-surface-container-high">
            {provenanceSteps.map((st, idx) => (
              <div key={idx} className="relative flex items-start gap-space-md pl-1">
                <div
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    st.done
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-primary text-on-primary'
                  }`}
                >
                  <Icon name={st.icon} className="text-lg" />
                </div>

                <div
                  className={`flex-1 rounded-lg p-space-md flex flex-col gap-1 ${
                    st.done ? 'bg-surface-container-low' : 'bg-surface-container-high'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-headline-sm text-base font-semibold text-on-surface">
                      {st.step}
                    </span>
                    <span className="font-mono-code text-xs font-bold text-on-surface-variant">
                      {st.time}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {st.desc}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 font-mono-code text-[11px] font-bold text-secondary">
                    <Icon name="verified_user" className="text-xs" />
                    <span>{st.proof}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 5. Consortium & Cryptographic Hash Block (SKILL.md 6.16) */}
        <Card variant="surface" className="p-space-lg shadow-md flex flex-col gap-space-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
              <Icon name="apartment" className="text-2xl text-secondary" />
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface block">
                  Pemerintah Kota Bandar Lampung
                </span>
                <span className="font-mono-code text-[10px] text-on-surface-variant">
                  Otoritas Koridor & PAD
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
              <Icon name="anchor" className="text-2xl text-secondary" />
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface block">
                  Pelindo Regional 2 Panjang
                </span>
                <span className="font-mono-code text-[10px] text-on-surface-variant">
                  Terminal Petikemas & Gate TOS
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
              <Icon name="school" className="text-2xl text-secondary" />
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface block">
                  Universitas Teknokrat Indonesia
                </span>
                <span className="font-mono-code text-[10px] text-on-surface-variant">
                  Riset GIS Spasial & IoT Engine
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
              <Icon name="gavel" className="text-2xl text-secondary" />
              <div>
                <span className="font-label-md text-xs font-bold text-on-surface block">
                  Disperindag & BKHIT Barantin
                </span>
                <span className="font-mono-code text-[10px] text-on-surface-variant">
                  Karantina & Kepatuhan Ekspor
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary-container text-surface-bright p-space-md rounded-lg flex flex-col gap-1">
            <span className="font-label-sm text-label-sm uppercase text-secondary-fixed">
              POSTGIS CRYPTOGRAPHIC STATE HASH (SHA-256 IMMUTABLE RECORD)
            </span>
            <span className="font-mono-code text-xs break-all text-surface-bright">
              {currentBatch.postGisStateHash}
            </span>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleDownloadAction}
        variant="approve"
        title={
          modalAction === 'dds'
            ? 'Unduh Dokumen Due Diligence Statement (DDS)'
            : modalAction === 'geojson'
            ? 'Ekspor Poligon Kebun GeoJSON (EPSG:4326)'
            : 'Verifikasi Ulang Kriptografi SHA-256 PostGIS'
        }
        subtitle={`BATCH ${currentBatch.id} • DDS ${currentBatch.ddsId}`}
        description={
          modalAction === 'dds'
            ? 'Dokumen resmi Due Diligence Statement sesuai Lampiran II Regulasi (EU) 2023/1115 siap diunduh untuk keperluan bea cukai pelabuhan tujuan di Eropa.'
            : modalAction === 'geojson'
            ? 'File GeoJSON berisi titik koordinat verteks poligon kebun rakyat dalam proyeksi standar WGS84 (EPSG:4326) siap diunduh.'
            : `Sistem akan memvalidasi ulang kecocokan hash state poligon (${currentBatch.postGisStateHash.slice(0, 18)}...) terhadap database PostGIS 3.4.`
        }
        impactWarning="Dampak Operasional: Pencatatan akses audit publik direkam ke dalam log transparansi ekspor Lampung Commodity Hub."
        confirmLabel={
          modalAction === 'dds'
            ? 'Unduh Dokumen DDS'
            : modalAction === 'geojson'
            ? 'Unduh File .GeoJSON'
            : 'Verifikasi Hash Sekarang'
        }
      />
    </div>
  );
}

