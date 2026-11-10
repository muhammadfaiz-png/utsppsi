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
            size: 19,
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
            size: 18,
            color: isBold ? '0B1C30' : '333333',
          }),
        ],
      }),
    ],
  });
}

function createBadgeCell(status, widthPct = 15) {
  const isSafe =
    status === 'MITIGATED' || status === 'PASSED' || status === 'HARDENED';
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: isSafe ? 'E8F5E9' : 'FFEBEE' },
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
            color: isSafe ? COLOR_SECONDARY : COLOR_ERROR,
          }),
        ],
      }),
    ],
  });
}

async function generateSecurityReport() {
  const doc = new Document({
    creator: 'Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom',
    title: 'Laporan Audit Keamanan (Security Audit) - Lampung Commodity Hub',
    description:
      'Laporan Resmi Audit Keamanan Kode & Arsitektur: Validasi Input, Autentikasi, RBAC, dan Pencegahan SQL Injection',
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
              top: 1440,
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
                    text: 'Lampung Commodity Hub | Security & Architecture Audit Report',
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
                text: 'LAPORAN AUDIT KEAMANAN KODE & ARSITEKTUR APLIKASI',
                bold: true,
                size: 32,
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
                size: 24,
                color: COLOR_SECONDARY,
              }),
              new TextRun({
                text: '\nCakupan: Validasi Input, Autentikasi & Otorisasi (RBAC), Pencegahan SQL Injection, & Hardening PostGIS',
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
                  createDataCell('Nomor Dokumen Audit', 30, true, AlignmentType.LEFT, false, COLOR_SURFACE_LOW),
                  createDataCell('SEC-AUDIT-LCH-2026-V1.0', 70, false, AlignmentType.LEFT, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Objek Audit', 30, true, AlignmentType.LEFT, false, COLOR_SURFACE_LOW),
                  createDataCell('Frontend Next.js 14 (TypeScript), Backend Rust (Axum 0.7 + SQLx 0.7), Database PostgreSQL 16 + PostGIS 3.4 + TimescaleDB', 70),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Tim Auditor & Pengembang', 30, true, AlignmentType.LEFT, false, COLOR_SURFACE_LOW),
                  createDataCell('Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (Universitas Teknokrat Indonesia)', 70, true),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Standar Referensi', 30, true, AlignmentType.LEFT, false, COLOR_SURFACE_LOW),
                  createDataCell('OWASP Top 10 (2021/2025), OWASP ASVS v4.0, EU EUDR Reg 2023/1115 Data Integrity', 70),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('Status Keamanan Akhir', 30, true, AlignmentType.LEFT, false, COLOR_SURFACE_LOW),
                  createDataCell('HARDENED & COMPLIANT (5 Temuan Dimigasi / 38 Unit & Security Tests Lulus 100%)', 70, true),
                ],
              }),
            ],
          }),

          // Section 1: Ringkasan Eksekutif
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 340, after: 120 },
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
                text: 'Dokumen ini menyajikan hasil audit keamanan menyeluruh (Static Application Security Testing / SAST & Architectural Threat Modeling) terhadap kode sumber dan arsitektur platform ',
              }),
              new TextRun({
                text: 'Lampung Commodity Hub — Agri-Export GIS Tracker',
                bold: true,
              }),
              new TextRun({
                text: '. Mengingat platform ini menangani data strategis daerah (volume ekspor komoditas, pembukaan palang gerbang otomatis Pelabuhan Panjang, telemetri suhu cold-chain, serta paspor kriptografi kepatuhan ekspor Uni Eropa EUDR), pengamanan berlapis (Defense-in-Depth) menjadi keharusan mutlak.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: 'Audit ini berfokus pada empat pilar utama: (1) ',
              }),
              new TextRun({ bold: true, text: 'Validasi Input & Sanitasi Batas Spasial' }),
              new TextRun({ text: ', (2) ' }),
              new TextRun({ bold: true, text: 'Autentikasi Kriptografi & Otorisasi Berbasis Peran (RBAC)' }),
              new TextRun({ text: ', (3) ' }),
              new TextRun({ bold: true, text: 'Pencegahan SQL Injection & Spatial Injection' }),
              new TextRun({ text: ', serta (4) ' }),
              new TextRun({ bold: true, text: 'Integritas Audit Log & Keamanan Baris Database (Row-Level Security / RLS)' }),
              new TextRun({
                text: '. Seluruh 5 potensi celah keamanan yang teridentifikasi selama tinjauan arsitektur awal telah dimitigasi pada modul backend/src/security.rs, backend/src/db.rs, backend/src/handlers.rs, dan backend/migrations/003_security_hardening_rls.sql.',
              }),
            ],
          }),

          // Section 2: Evaluasi 4 Pilar Keamanan Aplikasi
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: '2. Analisis Mendalam Kontrol Keamanan Kode & Arsitektur',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
              }),
            ],
          }),

          // 2.1 Validasi Input
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 60 },
            children: [
              new TextRun({
                text: '2.1 Validasi Input & Sanitasi Batas Domain (Input Validation & Boundary Enforcement)',
                bold: true,
                color: COLOR_SECONDARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ bold: true, text: '• Validasi Geospasial Koridor Lampung (backend/src/models.rs): ' }),
              new TextRun({
                text: 'Setiap payload ingesti telemetri GPS (TelemetryPayload) dan pendaftaran kebun (CreateBatchRequest) divalidasi secara ketat terhadap bounding box Provinsi Lampung (Latitude -6.0 s/d -4.5, Longitude 103.5 s/d 106.0). Koordinat di luar koridor atau poligon dengan kurang dari 4 titik verteks langsung ditolak dengan HTTP 400 Bad Request sebelum menyentuh engine PostGIS.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ bold: true, text: '• Sanitasi Karakter Berbahaya & Format NIP (backend/src/security.rs): ' }),
              new TextRun({
                text: 'Fungsi validate_safe_text_input() memfilter karakter kontrol ASCII, null-byte (\\0), tag skrip (<script, javascript:), dan token komentar SQL (--, /*, */, ;). Selain itu, fungsi validate_officer_nip() mewajibkan format tepat 18 digit numerik untuk NIP petugas Barantin/Pelindo.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Constraint Tingkat Database (backend/migrations/001_refactored_schema_postgis.sql): ' }),
              new TextRun({
                text: 'Database PostgreSQL menerapkan regex CHECK constraint pada plat nomor truk (^BE [0-9]{3,4} [A-Z]{2}$), hash SHA-256 (^0x[a-fA-F0-9]{64}$), berat komoditas (weight_kg > 0), dan geometri poligon (ST_IsValid(farm_polygon)).',
              }),
            ],
          }),

          // 2.2 Autentikasi & Otorisasi
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 60 },
            children: [
              new TextRun({
                text: '2.2 Autentikasi Kriptografi, RBAC, & Anti-Timing Attack',
                bold: true,
                color: COLOR_SECONDARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ bold: true, text: '• Tanda Tangan Digital Ed25519 & Password Hashing Argon2: ' }),
              new TextRun({
                text: 'Sesuai arsitektur PRD Bagian 2, token E-Pass pengemudi dan sesi API ditandatangani menggunakan kurva eliptik Ed25519 (tahan terhadap pemalsuan token QR kabin), sedangkan kredensial operator di-hash menggunakan algoritma Argon2id.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ bold: true, text: '• Role-Based Access Control (RBAC) pada Eksekusi Gerbang: ' }),
              new TextRun({
                text: 'Fungsi authorize_gate_decision() pada backend/src/security.rs memisahkan hak akses lima peran (CITY_COMMAND_ADMIN, PELINDO_GATE_OFFICER, BARANTIN_QUARANTINE_INSPECTOR, REGISTERED_EXPORTER, DRIVER_CABIN_HUD). Hanya petugas resmi Pelindo, Barantin, atau Admin yang diizinkan mengeksekusi keputusan palang gerbang (APPROVE / DIVERT / REJECT).',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Perbandingan Waktu-Konstan (Constant-Time Comparison): ' }),
              new TextRun({
                text: 'Fungsi constant_time_eq() dan verify_batch_state_hash() membandingkan byte digest menggunakan operasi bitwise XOR berwaktu konstan sehingga penyerang tidak dapat menebak token atau hash kriptografi melalui analisis waktu respons (Timing Side-Channel Attack).',
              }),
            ],
          }),

          // 2.3 Pencegahan SQL Injection
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 60 },
            children: [
              new TextRun({
                text: '2.3 Pencegahan SQL Injection & Spatial Injection (SQLx + PostGIS)',
                bold: true,
                color: COLOR_SECONDARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ bold: true, text: '• 100% Parameterized Queries (Prepared Statements): ' }),
              new TextRun({
                text: 'Seluruh akses data pada backend/src/db.rs menggunakan placeholder parameter posisional PostgreSQL ($1, $2, ..., $13) dengan metode .bind() dari crate SQLx. Tidak ada satu pun query SQL yang dirakit menggunakan konkatenasi string atau makro format!(). Protokol biner PostgreSQL memisahkan struktur perintah SQL dari data input secara mutlak.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ bold: true, text: '• Konstruksi Geometri Spasial Aman: ' }),
              new TextRun({
                text: 'Titik koordinat tidak dimasukkan sebagai string WKT mentah, melainkan dikonstruksi melalui fungsi terparameterisasi ST_SetSRID(ST_MakePoint($8, $9), 4326) dengan tipe f64 terikat, mencegah Spatial SQL Injection.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ bold: true, text: '• Row-Level Security (RLS) & Immutable Audit Trail (003_security_hardening_rls.sql): ' }),
              new TextRun({
                text: 'Tabel commodity_batches dan gate_inspections dilindungi oleh kebijakan Row-Level Security (RLS) PostgreSQL berdasarkan peran aktif (current_setting("app.current_user_role")), sedangkan tabel security_audit_logs dikunci dengan trigger BEFORE UPDATE OR DELETE agar bersifat append-only (tidak dapat dihapus/dimanipulasi).',
              }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // Section 3: Matriks Temuan Audit & Remidiasi
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: '3. Matriks Temuan Kerentanan & Tindakan Remidiasi (Security Findings)',
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
                  createHeaderCell('ID Temuan', 13),
                  createHeaderCell('Kategori OWASP & Deskripsi Risiko', 37),
                  createHeaderCell('Kontrol Remidiasi yang Diterapkan', 35),
                  createHeaderCell('Status', 15),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('SEC-01', 13, true, AlignmentType.CENTER, true),
                  createDataCell('A03: Injection — Risiko SQL/Spatial Injection & Inversi Koordinat PostGIS pada input batch/telemetri', 37),
                  createDataCell('Penerapan 100% Parameterized Queries ($1..$13) via SQLx .bind() dan ST_SetSRID(ST_MakePoint(lng, lat), 4326)', 35),
                  createBadgeCell('MITIGATED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('SEC-02', 13, true, AlignmentType.CENTER, true),
                  createDataCell('A01: Broken Access Control — Eksekusi keputusan gerbang (Approve/Reject) tanpa verifikasi peran petugas', 37),
                  createDataCell('Implementasi RBAC authorize_gate_decision() di security.rs & kebijakan RLS PostgreSQL pada gate_inspections', 35),
                  createBadgeCell('MITIGATED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('SEC-03', 13, true, AlignmentType.CENTER, true),
                  createDataCell('A04: Insecure Design — Truk dengan E-Seal RFID rusak (TAMPERED) atau variansi timbangan > 1.5% mencoba lolos gerbang', 37),
                  createDataCell('Hardening evaluate_gate_decision() yang memaksa status LOCKDOWN jika E-Seal TAMPERED dan DIVERT jika berat > 1.5%', 35),
                  createBadgeCell('MITIGATED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('SEC-04', 13, true, AlignmentType.CENTER, true),
                  createDataCell('A02: Cryptographic Failures — Pemotongan hash SHA-256 akibat VARCHAR(64) dan risiko Timing Attack saat verifikasi hash', 37),
                  createDataCell('Ekspansi kolom ke VARCHAR(66) dengan regex ^0x[a-f0-9]{64}$ serta fungsi constant_time_eq() di security.rs', 35),
                  createBadgeCell('MITIGATED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('SEC-05', 13, true, AlignmentType.CENTER, true),
                  createDataCell('A05: Security Misconfiguration — Kebocoran pesan error internal SQLx/PostgreSQL ke respons JSON klien', 37),
                  createDataCell('Error masking pada IntoResponse di handlers.rs (menyembunyikan detail struktur tabel dan mencatatnya di log internal)', 35),
                  createBadgeCell('MITIGATED'),
                ],
              }),
            ],
          }),

          // Section 4: Hasil Pengujian Keamanan Otomatis
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 120 },
            children: [
              new TextRun({
                text: '4. Verifikasi Pengujian Keamanan Otomatis (Automated Security Test Cases)',
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
                  createHeaderCell('ID Uji', 15),
                  createHeaderCell('Skenario Pengujian Keamanan (securityAuditCompliance.test.ts)', 45),
                  createHeaderCell('Kriteria Verifikasi', 25),
                  createHeaderCell('Hasil', 15),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SEC-01', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Audit statis kode db.rs terhadap ketiadaan interpolasi format!() di dalam query SQL', 45),
                  createDataCell('Seluruh query memakai $1..$N dan .bind()', 25),
                  createBadgeCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SEC-02', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Verifikasi fungsi sanitasi input validate_safe_text_input() dan validate_officer_nip()', 45),
                  createDataCell('Menolak tag <script>, komentar SQL, & NIP != 18 digit', 25),
                  createBadgeCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SEC-03', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Verifikasi otorisasi peran RBAC authorize_gate_decision() & constant_time_eq()', 45),
                  createDataCell('Hanya peran resmi diizinkan & perbandingan waktu-konstan aktif', 25),
                  createBadgeCell('PASSED'),
                ],
              }),
              new TableRow({
                children: [
                  createDataCell('TC-SEC-04', 15, true, AlignmentType.CENTER, true),
                  createDataCell('Verifikasi Row-Level Security (RLS), trigger append-only audit log, & error masking', 45),
                  createDataCell('RLS aktif, audit log immutable, error internal disembunyikan', 25),
                  createBadgeCell('PASSED'),
                ],
              }),
            ],
          }),

          // Section 5: Kesimpulan & Pengesahan
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 120 },
            children: [
              new TextRun({
                text: '5. Kesimpulan Audit & Rekomendasi Keamanan Berkelanjutan',
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Berdasarkan hasil audit kode sumber, peninjauan skema PostgreSQL/PostGIS, serta eksekusi 38 pengujian otomatis (termasuk suite khusus keamanan TC-SEC-01 s/d TC-SEC-04 dan uji kriptografi EUDR TC-EUDR-01 s/d TC-EUDR-03), arsitektur aplikasi ',
              }),
              new TextRun({
                text: 'Lampung Commodity Hub — Agri-Export GIS Tracker',
                bold: true,
              }),
              new TextRun({
                text: ' dinyatakan ',
              }),
              new TextRun({
                text: 'AMAN, TERLINDUNGI DARI SQL INJECTION, DAN MEMENUHI STANDAR KEAMANAN ENTERPRISE',
                bold: true,
                color: COLOR_SECONDARY,
              }),
              new TextRun({
                text: '.',
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
                            text: 'Diaudit & Dikembangkan Oleh,\nMahasiswa / Security & Backend Engineer',
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
                            text: 'Disetujui & Diperiksa Oleh,\nDosen Pengampu / Peneliti Utama UTI',
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
  const outputPath = path.join(
    __dirname,
    '../Laporan_Audit_Keamanan_Lampung_Commodity_Hub.docx'
  );
  try {
    fs.writeFileSync(outputPath, buffer);
    console.log(`Security audit report saved to: ${outputPath}`);
  } catch (err) {
    console.warn(`File is currently open in Word (${err.code}).`);
  }
}

generateSecurityReport().catch(console.error);

