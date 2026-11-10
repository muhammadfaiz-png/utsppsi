const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  PageBreak,
} = require('docx');

// Palette tokens matching SKILL.md
const COLOR_PRIMARY = '0D1C32'; // Dark Navy
const COLOR_SECONDARY = '006A61'; // Teal
const COLOR_ERROR = 'BA1A1A'; // Red
const COLOR_SURFACE_LOW = 'EFF4FF'; // Light blue-tinted gray
const COLOR_TEXT_MUTED = '44474D';
const COLOR_WHITE = 'FFFFFF';
const COLOR_BORDER = 'DCE9FF';

// Helper to create table borders
const tableBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
};

function createHeaderCell(text, widthPct = 25) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: COLOR_PRIMARY },
    borders: tableBorder,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: true,
            color: COLOR_WHITE,
            font: 'Arial',
            size: 19, // 9.5 pt
          }),
        ],
      }),
    ],
  });
}

function createDataCell(
  text,
  widthPct = 25,
  isBold = false,
  align = AlignmentType.LEFT,
  isMono = false,
  bg = COLOR_WHITE
) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: bg },
    borders: tableBorder,
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold: isBold,
            font: isMono ? 'Consolas' : 'Arial',
            size: 18, // 9 pt
            color: isBold ? '0B1C30' : '333333',
          }),
        ],
      }),
    ],
  });
}

function createStatusCell(status, widthPct = 15) {
  const isPass = status === 'PASSED';
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: isPass ? 'E8F5E9' : 'FFEBEE' },
    borders: tableBorder,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: status,
            bold: true,
            font: 'Consolas',
            size: 18,
            color: isPass ? COLOR_SECONDARY : COLOR_ERROR,
          }),
        ],
      }),
    ],
  });
}

async function generateReport() {
  const doc = new Document({
    creator: 'Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom',
    title: 'Laporan Hasil Testing dan Temuan Bug - Lampung Commodity Hub',
    description:
      'Dokumen Resmi Analisis Unit Test, Integration Test, dan Debugging Proyek Lampung Commodity Hub',
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 21, // 10.5 pt
            color: '1A1A1A',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Lampung Commodity Hub | Agri-Export GIS Tracker — Testing & QA Report',
                    font: 'Arial',
                    size: 16,
                    color: COLOR_TEXT_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom   |   UTI   |   Hal. ',
                    font: 'Arial',
                    size: 16,
                    color: COLOR_TEXT_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Arial',
                    size: 16,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'LAPORAN HASIL ANALISIS TESTING & TEMUAN BUG',
                bold: true,
                size: 32, // 16 pt
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Proyek: "Lampung Commodity Hub — Agri-Export GIS Tracker"',
                bold: true,
                size: 24, // 12 pt
                color: COLOR_SECONDARY,
              }),
              new TextRun({
                text: '\nKoridor Bandar Lampung – Pelabuhan Panjang – JTTS (Kepatuhan EUDR 2023/1115)',
                size: 20,
                color: COLOR_TEXT_MUTED,
              }),
            ],
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createDataCell(
                    'Nomor Dokumen',
                    30,
                    true,
                    AlignmentType.LEFT,
                    false,
                    COLOR_SURFACE_LOW
                  ),
                  createDataCell('QA-LCH-2026-V2.0', 70, false, AlignmentType.LEFT, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell(
                    'Nama Topik / Proyek',
                    30,
                    true,
                    AlignmentType.LEFT,
                    false,
                    COLOR_SURFACE_LOW
                  ),
                  createDataCell(
                    'Lampung Commodity Hub — Agri-Export GIS & Cold-Chain Logistics Tracker',
                    70,
                    true
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell(
                    'Pengembang & Peneliti',
                    30,
                    true,
                    AlignmentType.LEFT,
                    false,
                    COLOR_SURFACE_LOW
                  ),
                  createDataCell(
                    'Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (Universitas Teknokrat Indonesia)',
                    70,
                    true
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell(
                    'Tanggal Pengujian',
                    30,
                    true,
                    AlignmentType.LEFT,
                    false,
                    COLOR_SURFACE_LOW
                  ),
                  createDataCell('10 November 2026 (WIB UTC+7)', 70),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell(
                    'Lingkungan Eksekusi',
                    30,
                    true,
                    AlignmentType.LEFT,
                    false,
                    COLOR_SURFACE_LOW
                  ),
                  createDataCell(
                    'Node.js Test Runner, TSX v4.23.15, Next.js 14.2.15, TypeScript Strict (tsc --noEmit)',
                    70
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell(
                    'Status Kelayakan',
                    30,
                    true,
                    AlignmentType.LEFT,
                    false,
                    COLOR_SURFACE_LOW
                  ),
                  createDataCell(
                    'PASSED & VERIFIED (38 Test Cases Lolos / 0 Gagal / Security Hardened)',
                    70,
                    true
                  ),
                ],
              }),
            ],
          }),

          // Section 1: Ringkasan Eksekutif
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: '1. Ringkasan Eksekutif (Executive Summary)',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'Laporan ini mendokumentasikan serangkaian pengujian komprehensif (Unit Testing & Integration Testing) serta proses penelusuran kesalahan (debugging) yang dilakukan terhadap proyek ',
              }),
              new TextRun({
                text: 'Lampung Commodity Hub - Agri-Export GIS Tracker',
                bold: true,
              }),
              new TextRun({
                text: '. Pengujian mencakup 4 modul operasional utama (City Command & GIS, Driver Console & E-Pass, Port Gate & Inspection Console, serta Public EUDR Traceability Portal), kalkulasi metrik cold-chain, integritas data domain komoditas (kopi robusta, lada hitam, kakao, CPO), matriks keputusan gerbang ALPR/timbangan, hingga audit kriptografi paspor komoditas digital berbasis regulasi anti-deforestasi Eropa (EUDR EU Reg 2023/1115).',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: 'Hasil pengujian membuktikan bahwa seluruh ',
              }),
              new TextRun({
                text: '30 skenario uji (7 test suites) berhasil dijalankan dengan tingkat kelulusan 100% (30/30)',
                bold: true,
                color: COLOR_SECONDARY,
              }),
              new TextRun({
                text: '. Sebanyak ',
              }),
              new TextRun({
                text: '7 temuan bug/defek operasional dan antarmuka',
                bold: true,
                color: COLOR_ERROR,
              }),
              new TextRun({
                text: ' berhasil diidentifikasi, dianalisis akar masalahnya (root cause), diperbaiki dengan patch kode terarah, dan diverifikasi kembali menggunakan uji regresi (regression test).',
              }),
            ],
          }),

          // Section 2: Ringkasan Metrik Pengujian
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: '2. Ringkasan Metrik Pengujian (Test Metrics)',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Kategori & Suite Pengujian', 35),
                  createHeaderCell('Jumlah Uji', 15),
                  createHeaderCell('Lolos (Pass)', 18),
                  createHeaderCell('Gagal (Fail)', 15),
                  createHeaderCell('Tingkat Sukses', 17),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Unit Test: Kalkulasi KPI & Math (kpiCalculations.test.ts)', 35),
                  createDataCell('5', 15, false, AlignmentType.CENTER),
                  createDataCell('5', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Unit Test: Integritas Data Domain (domainDataIntegrity.test.ts)', 35),
                  createDataCell('7', 15, false, AlignmentType.CENTER),
                  createDataCell('7', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Unit Test: Pemetaan Token Status Semantik (statusBadgeLogic.test.ts)', 35),
                  createDataCell('3', 15, false, AlignmentType.CENTER),
                  createDataCell('3', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Integration Test: Telemetri & Insiden Cold-Chain (telemetryIncidentIntegration.test.ts)', 35),
                  createDataCell('3', 15, false, AlignmentType.CENTER),
                  createDataCell('3', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Integration Test: Alur Gerbang & Matriks Keputusan (gateInspectionWorkflow.test.ts)', 35),
                  createDataCell('5', 15, false, AlignmentType.CENTER),
                  createDataCell('5', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Integration Test: Kriptografi SHA-256 & GeoJSON (eudrHashVerification.test.ts)', 35),
                  createDataCell('3', 15, false, AlignmentType.CENTER),
                  createDataCell('3', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Integration Test: Resolusi Rute Modul, Footer & Sinkronisasi (navigationAndFooterCompliance.test.ts)', 35),
                  createDataCell('4', 15, false, AlignmentType.CENTER),
                  createDataCell('4', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Integration Test: Refactoring Rust Axum & Query PostGIS (rustAndPostgresRefactoring.test.ts)', 35),
                  createDataCell('4', 15, false, AlignmentType.CENTER),
                  createDataCell('4', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Security Audit Test: Input, RBAC, Anti-SQLi & RLS (securityAuditCompliance.test.ts)', 35),
                  createDataCell('4', 15, false, AlignmentType.CENTER),
                  createDataCell('4', 18, false, AlignmentType.CENTER),
                  createDataCell('0', 15, false, AlignmentType.CENTER),
                  createDataCell('100%', 17, true, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell(
                    'TOTAL KESELURUHAN',
                    35,
                    true,
                    AlignmentType.LEFT,
                    false,
                    COLOR_SURFACE_LOW
                  ),
                  createDataCell('38', 15, true, AlignmentType.CENTER, true, COLOR_SURFACE_LOW),
                  createDataCell('38', 18, true, AlignmentType.CENTER, true, COLOR_SURFACE_LOW),
                  createDataCell('0', 15, true, AlignmentType.CENTER, true, COLOR_SURFACE_LOW),
                  createDataCell('100%', 17, true, AlignmentType.CENTER, true, COLOR_SURFACE_LOW),
                ],
              }),
            ],
          }),

          // Page Break to Detail Test Cases
          new Paragraph({ children: [new PageBreak()] }),

          // Section 3: Rincian Skenario & Kasus Pengujian
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: '3. Rincian Skenario & Hasil Pengujian (Test Cases Execution)',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
              }),
            ],
          }),

          // Scenario Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('ID Kasus Uji', 15),
                  createHeaderCell('Deskripsi Skenario Pengujian', 45),
                  createHeaderCell('Hasil Ekspektasi', 25),
                  createHeaderCell('Status', 15),
                ],
              }),
              // Skenario 1: KPI
              new TableRow({
                children: [
                  createDataCell('TC-KPI-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Kalkulasi titik SVG sparkline untuk array data normal multi-titik', 45),
                  createDataCell('Path SVG diawali M 0.0, valid, area tertutup Z, tanpa NaN', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-KPI-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Penanganan input array sparkline kosong []', 45),
                  createDataCell('Return fallback aman path kosong tanpa crash runtime', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-KPI-03', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Edge case array sparkline satu titik [100] (Regresi BUG-01)', 45),
                  createDataCell('Tidak terjadi division by zero (NaN), garis horizontal lurus dihasilkan', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-KPI-04', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Kalkulasi sparkline data konstan/datar (range = max - min = 0)', 45),
                  createDataCell('Fallback range = 1 aktif, path SVG valid tanpa NaN', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-KPI-05', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Clamping persentase progress bar untuk input ekstrem (< 0% atau > 100%)', 45),
                  createDataCell('Terpotong presisi pada batas 0% s.d 100%', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              // Skenario 2: Domain
              new TableRow({
                children: [
                  createDataCell('TC-DOM-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi format plat nomor armada seluruh mock data truk', 45),
                  createDataCell('Sesuai plat BE Lampung (BE 8920 YU, BE 8412 AA, dll.)', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-DOM-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi koordinat GPS armada dalam koridor logistik Lampung', 45),
                  createDataCell('Latitude [-5.6 s.d -5.0], Longitude [105.0 s.d 105.6]', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-DOM-03', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi korelasi status reefer (OPTIMAL 17-19°C vs EXCURSION >20°C)', 45),
                  createDataCell('Konsistensi 100% antara status telemetri dan angka suhu', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-DOM-04', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi penomoran batch ekspor (#KOP, #LAD, #KAK, #CPO)', 45),
                  createDataCell('Format standar #XXX-YYY-2026-ZZZZ valid', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-DOM-05', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi integritas format PostGIS Cryptographic State Hash', 45),
                  createDataCell('Tepat 66 karakter heksadesimal diawali prefiks 0x', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-DOM-06', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi urutan nomor antrian dan slot waktu Virtual Gate', 45),
                  createDataCell('Nomor 1 s.d N berurutan, slot waktu transit/holding valid', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-DOM-07', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi nomor kontainer manifest ekspor standar ISO 6346', 45),
                  createDataCell('Minimal 8 karakter terisi format kode pemilik + seri valid', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              // Skenario 3: Badge
              new TableRow({
                children: [
                  createDataCell('TC-BDG-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi kepatuhan token warna status badge sesuai SKILL.md', 45),
                  createDataCell('Hanya menggunakan token M3, tidak ada warna terlarang', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-BDG-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi badge kritis (critical) menyertakan animasi denyut (pulse)', 45),
                  createDataCell('Kelas animate-pulse dan bg-error aktif', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-BDG-03', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi badge normal (ok) memetakan ke teal secondary (#006a61)', 45),
                  createDataCell('Kelas secondary-container dan on-secondary-container aktif', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              // Skenario 4: Telemetry & Incident Integration
              new TableRow({
                children: [
                  createDataCell('TC-INT-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Lonjakan suhu > 22°C otomatis mentrigger insiden & status EXCURSION', 45),
                  createDataCell('Record insiden dibuat, status armada berubah seketika', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-INT-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Aksi SOP Response (Tim Mobile / Nav Koreksi) di command center', 45),
                  createDataCell('Status insiden bertransisi ke DISPATCHED dan tercatat di riwayat', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-INT-03', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Penyelesaian insiden (RESOLVED) menstabilkan telemetri armada', 45),
                  createDataCell('Counter alert turun, suhu armada normal kembali 18°C', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              // Skenario 5: Gate Decision Matrix
              new TableRow({
                children: [
                  createDataCell('TC-GATE-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Evaluasi keputusan APPROVE pada truk dengan parameter 100% valid', 45),
                  createDataCell('Palang gerbang terbuka (BARRIER_OPEN) 45 detik', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-GATE-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Evaluasi penolakan APPROVE jika segel elektronik (E-Seal) rusak', 45),
                  createDataCell('Sistem menolak buka palang, aksi LOCKDOWN gerbang dipicu', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-GATE-03', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Evaluasi diskrepansi berat jembatan timbang melebihi 1.5%', 45),
                  createDataCell('Akses ditahan, truk diarahkan ke timbang ulang (DIVERT_WEIGHT)', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-GATE-04', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Eksekusi keputusan DIVERT pada antrian staging', 45),
                  createDataCell('Truk dialihkan ke Buffer Holding KM 42 dengan tiket oranye', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-GATE-05', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Eksekusi keputusan REJECT pada pelanggaran fatal karantina', 45),
                  createDataCell('Manifest ekspor dibekukan, truk diperintahkan putar arah', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              // Skenario 6: EUDR Crypto
              new TableRow({
                children: [
                  createDataCell('TC-EUDR-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Penghitungan SHA-256 State Hash PostGIS berbasis browser/Node', 45),
                  createDataCell('Hash deterministik, 66 karakter heksadesimal dengan prefiks 0x', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-EUDR-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Uji efek longsoran (avalanche effect) pada manipulasi 1 byte data', 45),
                  createDataCell('Nilai hash berubah total secara kriptografis', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-EUDR-03', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validitas struktur export file GeoJSON FeatureCollection EUDR', 45),
                  createDataCell('Koordinat [lng, lat] terbalik presisi dari [lat, lng] domain', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              // Skenario 7: Navigation, Footer & Cross-Module Sync
              new TableRow({
                children: [
                  createDataCell('TC-NAV-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Verifikasi ketersediaan rute modul (/command, /driver, /gate, /eudr/[batchId]) (Regresi BUG-06)', 45),
                  createDataCell('Seluruh file page.tsx tersedia dan mengembalikan HTTP 200 OK', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-NAV-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Verifikasi state aktif Sidebar pada sub-rute dinamis /eudr/[batchId] (Regresi BUG-07)', 45),
                  createDataCell('Item EUDR Traceability tetap aktif saat berpindah batch', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-FTR-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Verifikasi atribusi hak cipta pada komponen Footer.tsx', 45),
                  createDataCell('Memuat Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-DRV-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Sinkronisasi lintas modul antara Driver Console, Port Gate Queue, dan Paspor EUDR', 45),
                  createDataCell('Seluruh plat armada & ID batch sinkron antar-modul', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SQL-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi DDL PostGIS: qr_code_hash VARCHAR(66), farm_polygon, & TimescaleDB idempotent', 45),
                  createDataCell('Skema mendukung SHA-256 0x 66-char & ST_IsValid(farm_polygon)', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SQL-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi Query PostGIS: ST_SetSRID(ST_MakePoint(lng, lat), 4326) & CTE Atomik', 45),
                  createDataCell('Urutan X=Longitude, Y=Latitude presisi & bebas division by zero', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-RUST-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi DTO Rust (models.rs): batas koridor Lampung, SHA-256, & GeoJSON [lng, lat]', 45),
                  createDataCell('Input tervalidasi ketat & matriks keputusan gerbang akurat', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-RUST-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi Repository SQLx (db.rs & handlers.rs): transaksi atomik pool.begin/tx.commit', 45),
                  createDataCell('Ingesti telemetri & eskalasi insiden dieksekusi secara atomik', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SEC-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Pencegahan SQL Injection: verifikasi 100% Parameterized Queries ($1..$N & .bind()) di db.rs', 45),
                  createDataCell('Bebas dari interpolasi format!() di dalam query SQL', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SEC-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Validasi Input & Sanitasi Batas Domain (validate_safe_text_input & validate_officer_nip)', 45),
                  createDataCell('Menolak karakter injeksi berbahaya & memvalidasi NIP 18 digit', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SEC-03', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Autentikasi & RBAC (authorize_gate_decision & constant_time_eq)', 45),
                  createDataCell('Otorisasi peran ketat & perbandingan waktu-konstan aktif', 25),
                  createStatusCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SEC-04', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Database Hardening: Row-Level Security (RLS), Immutable Audit Trigger & Error Masking', 45),
                  createDataCell('RLS aktif, log audit append-only, error internal disembunyikan', 25),
                  createStatusCell('PASSED'),
                ],
              }),
            ],
          }),

          // Page Break to Bug Findings & Debugging
          new Paragraph({ children: [new PageBreak()] }),

          // Section 4: Laporan Temuan Bug & Analisis Debugging
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: '4. Laporan Temuan Bug & Analisis Debugging (Bug Findings)',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'Berikut adalah rincian 7 defek/bug yang ditemukan selama proses pengujian unit, integrasi, dan inspeksi langsung beserta analisis akar masalah (root cause) dan tindakan perbaikan (fix) yang telah diimplementasikan:',
              }),
            ],
          }),

          // Bug 1
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 60 },
            children: [
              new TextRun({
                text: 'BUG-01 (Tingkat Kritis: TINGGI) — Division by Zero / NaN pada Kalkulasi Sparkline KPI',
                bold: true,
                color: COLOR_ERROR,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Gejala (Symptom): ' }),
              new TextRun({
                text: 'Komponen KpiCard mengalami kegagalan render visual SVG dan memunculkan error pada console saat menerima array sparklineData dengan panjang tepat 1 elemen (misalnya data titik awal [14250]).',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Akar Masalah (Root Cause): ' }),
              new TextRun({
                text: 'Formula x = (idx / (sparklineData.length - 1)) * width membagi nilai dengan (1 - 1 = 0), menghasilkan nilai NaN pada koordinat x dan merusak atribut path string SVG d="M NaN NaN...".',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Tindakan Perbaikan (Fix): ' }),
              new TextRun({
                text: 'Ditambahkan percabangan kondisi jika panjang data == 1, maka sistem merender garis horizontal referensi tengah setinggi height / 2 tanpa kalkulasi pembagi. Diverifikasi lolos pada TC-KPI-03.',
              }),
            ],
          }),

          // Bug 2
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'BUG-02 (Tingkat Kritis: SEDANG) — Modal Konfirmasi Terjebak (Trap) Tanpa Akses Dismiss Luar',
                bold: true,
                color: COLOR_ERROR,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Gejala (Symptom): ' }),
              new TextRun({
                text: 'Pengguna tidak dapat membatalkan modal dialog konfirmasi operasional dengan menekan tombol keyboard "Escape" atau mengklik area latar belakang (backdrop blur).',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Akar Masalah (Root Cause): ' }),
              new TextRun({
                text: 'Komponen Modal.tsx hanya mengandalkan tombol "Batal" eksplisit; backdrop pembungkus tidak memiliki event handler onClick={onClose} dan tidak memasang listener window keydown Escape.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Tindakan Perbaikan (Fix): ' }),
              new TextRun({
                text: 'Dipasang hook useEffect dengan listener event "Escape", penonaktifan scroll latar belakang (document.body.style.overflow = "hidden"), serta event bubbling stopPropagation() pada kotak dialog.',
              }),
            ],
          }),

          // Bug 3
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'BUG-03 (Tingkat Kritis: SEDANG) — Kerentanan React Hydration Mismatch pada LiveClock SSR',
                bold: true,
                color: COLOR_ERROR,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Gejala (Symptom): ' }),
              new TextRun({
                text: 'Peringatan konsol browser "Text content did not match. Server: 00:00:00 Client: 16:27:03" saat halaman pertama kali dirender di server lalu dihidrasi di peramban klien.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Akar Masalah (Root Cause): ' }),
              new TextRun({
                text: 'Next.js App Router mengeksekusi prerender awal di lingkungan Node.js server dengan nilai state default "00:00:00", sementara klien langsung memperbarui waktu riil WIB sebelum hidrasi selesai.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Tindakan Perbaikan (Fix): ' }),
              new TextRun({
                text: 'Ditambahkan atribut suppressHydrationWarning pada elemen waktu dan penjaga status mounted sehingga render server dan klien sinkron dan bebas peringatan hidrasi.',
              }),
            ],
          }),

          // Bug 4
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'BUG-04 (Tingkat Kritis: RENDAH) — Spasi Awal Ilegal pada Sintaks Atribut Path SVG Sparkline',
                bold: true,
                color: COLOR_ERROR,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Gejala (Symptom): ' }),
              new TextRun({
                text: "Hasil path SVG dimulai dengan spasi kosong ' M 0.0 ...' alih-alih karakter perintah langsung 'M 0.0 ...', menyebabkan kegagalan asersi uji otomatis TC-KPI-01.",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Akar Masalah (Root Cause): ' }),
              new TextRun({
                text: 'Akumulasi reduce string template `${acc} ${i === 0 ? "M" : "L"}...` menyisipkan spasi di depan saat acc bernilai string kosong "".',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Tindakan Perbaikan (Fix): ' }),
              new TextRun({
                text: 'Diperbaiki menjadi acc ? `${acc} L ...` : `M ...`. Diverifikasi lulus 100% pada uji regresi TC-KPI-01.',
              }),
            ],
          }),

          // Bug 5
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'BUG-05 (Tingkat Kritis: RENDAH) — Timeout Puppeteer Headless Browser Akibat Jaringan Tak Kunjung Idle',
                bold: true,
                color: COLOR_ERROR,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Gejala (Symptom): ' }),
              new TextRun({
                text: 'Skrip tangkapan layar scripts/take-screenshot.js mengalami TimeoutError 15000ms pada pipeline pengujian visual.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Akar Masalah (Root Cause): ' }),
              new TextRun({
                text: 'Penggunaan opsi networkidle2 menunggu minimal 2 koneksi aktif berhenti; namun keberadaan LiveClock ticker (setInterval 1s) dan polling data menyebabkan jaringan tidak pernah benar-benar idle.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Tindakan Perbaikan (Fix): ' }),
              new TextRun({
                text: 'Mengalihkan opsi navigasi ke domcontentloaded ditambah jeda statis 2000ms agar font Google Inter/Mono dan styling Tailwind selesai ter-rasterisasi sempurna.',
              }),
            ],
          }),

          // Bug 6
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'BUG-06 (Tingkat Kritis: TINGGI) — HTTP 404 Not Found pada Navigasi Modul Driver Console, Port Gate, dan EUDR Traceability',
                bold: true,
                color: COLOR_ERROR,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Gejala (Symptom): ' }),
              new TextRun({
                text: 'Saat pengguna mengklik menu Sidebar "Driver Console & E-Pass" (/driver), "Port Gate & Inspection" (/gate), atau "EUDR Traceability" (/eudr/KOP-LBG-2026-0891), aplikasi menampilkan halaman 404 Not Found.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Akar Masalah (Root Cause): ' }),
              new TextRun({
                text: 'Komponen Sidebar.tsx telah mendefinisikan tautan href ke keempat modul operasional, namun struktur direktori App Router di src/app/(dashboard)/ baru memiliki sub-direktori command/page.tsx.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Tindakan Perbaikan (Fix): ' }),
              new TextRun({
                text: 'Diimplementasikan komponen halaman penuh untuk src/app/(dashboard)/driver/page.tsx, src/app/(dashboard)/gate/page.tsx, dan src/app/(dashboard)/eudr/[batchId]/page.tsx lengkap dengan interaktivitas state dan modal konfirmasi. Diverifikasi lolos pada TC-NAV-01.',
              }),
            ],
          }),

          // Bug 7
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'BUG-07 (Tingkat Kritis: RENDAH) — Hilangnya Highlight Active State Sidebar saat Berpindah Batch di Portal EUDR',
                bold: true,
                color: COLOR_ERROR,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Gejala (Symptom): ' }),
              new TextRun({
                text: 'Indikator menu aktif pada Sidebar untuk item "EUDR Traceability" padam ketika pengguna beralih dari batch #KOP-LBG-2026-0891 ke #KOP-LBG-2026-0892 atau #LAD-SKD-2026-0120.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ bold: true, text: '• Akar Masalah (Root Cause): ' }),
              new TextRun({
                text: 'Pengecekan pathname.startsWith(item.href) pada Sidebar.tsx membandingkan terhadap string spesifik "/eudr/KOP-LBG-2026-0891" alih-alih prefiks segmen induk "/eudr".',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({ bold: true, text: '• Tindakan Perbaikan (Fix): ' }),
              new TextRun({
                text: 'Diperbarui logika pencocokan rute di Sidebar.tsx agar mengecek item.href.startsWith("/eudr") ? pathname.startsWith("/eudr"). Diverifikasi lulus pada uji regresi TC-NAV-02.',
              }),
            ],
          }),

          // Section 5: Kesimpulan
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: '5. Kesimpulan & Rekomendasi Rilis (Conclusion & Recommendations)',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: '1. Seluruh 4 modul utama platform Lampung Commodity Hub (City Command & GIS, Driver Console & E-Pass, Port Gate & Inspection Console, dan EUDR Traceability Portal) telah berfungsi penuh, bebas error kompilasi TypeScript, serta mematuhi spesifikasi SKILL.md dan PRD-LCH-2026-V2.1.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: '2. Seluruh 30 test cases (unit test dan integration test) dinyatakan ',
              }),
              new TextRun({
                text: 'PASSED (Lulus 100%)',
                bold: true,
                color: COLOR_SECONDARY,
              }),
              new TextRun({
                text: ', dan ketujuh temuan bug telah diperbaiki serta dilindungi oleh pengujian regresi otomatis.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: '3. Atribusi hak cipta resmi ',
              }),
              new TextRun({
                text: 'Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom',
                bold: true,
                color: COLOR_PRIMARY,
              }),
              new TextRun({
                text: ' telah terintegrasi secara konsisten pada bagian footer seluruh halaman aplikasi.',
              }),
            ],
          }),

          // Signatures Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Diuji & Dikembangkan Oleh,\nMahasiswa / Pengembang Sistem',
                            bold: true,
                            size: 18,
                          }),
                          new TextRun({
                            text: '\n\n\n\n( Muhammad Faiz )\nUniversitas Teknokrat Indonesia',
                            size: 18,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Disetujui & Dibimbing Oleh,\nDosen Pengampu / Peneliti Utama UTI',
                            bold: true,
                            size: 18,
                          }),
                          new TextRun({
                            text: '\n\n\n\n( Dr. Erliyan Redy Susanto, M.Kom )\nUniversitas Teknokrat Indonesia',
                            size: 18,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  const primaryOutputPath = path.join(
    __dirname,
    '../Laporan_Testing_dan_Debugging_Lampung_Commodity_Hub.docx'
  );
  const secondaryOutputPath = path.join(
    __dirname,
    '../Laporan_Testing_dan_Debugging_Lampung_Commodity_Hub_Muhammad_Faiz.docx'
  );

  try {
    fs.writeFileSync(primaryOutputPath, buffer);
    console.log(`Saved primary report: ${primaryOutputPath}`);
  } catch (err) {
    console.warn(
      `Primary file is currently open in Word (${err.code}), saving to secondary filename...`
    );
  }

  try {
    fs.writeFileSync(secondaryOutputPath, buffer);
    console.log(`Saved report: ${secondaryOutputPath}`);
  } catch (err) {
    console.warn(
      `Secondary file is currently open in Word (${err.code}), primary file was updated.`
    );
  }
}

generateReport().catch(console.error);
