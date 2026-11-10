# Product Requirement Document (PRD)
## Lampung Commodity Hub & Agri-Export Logistics Tracker

**Document ID:** `PRD-LCH-2026-V2.1`  
**Version:** `2.1.0 (Approved / Enterprise Grade)`  
**Target Release:** `Q3 2026`  
**Backend Architecture:** `Rust 1.78+ (Axum + SQLx + Tokio)`  
**Database Stack:** `PostgreSQL 16 + PostGIS 3.4 + TimescaleDB`  

---

## 1. Visi Produk & Konteks Strategis

### 1.1 Konteks Wilayah
Kota Bandar Lampung berfungsi sebagai simpul logistik dan pintu keluar utama ekspor produk agrikultur Provinsi Lampung (seperti Kopi Robusta, Lada Hitam, Kakao, dan Pisang). Kendala operasional utama meliputi:
- Kemacetan di koridor Jalur Bypass Soekarno-Hatta dan Jalan Yos Sudarso akibat penumpukan truk kontainer di Pelabuhan Panjang.
- Tingkat penyusutan dan penurunan mutu barang transit (8–12%) akibat kurangnya pemantauan kondisi lingkungan (suhu & kelembapan) muatan.
- Tuntutan regulasi ekspor global (seperti *European Union Deforestation Regulation* / EUDR) yang mewajibkan transparansi koordinat asal lahan panen.

### 1.2 Tujuan Platform
Membangun engine backend berkinerja tinggi berbasis **Rust** (`Axum`, `SQLx`, `Tokio`) dan layer data **PostgreSQL 16** (dengan ekstensi **PostGIS** untuk geofencing/spasial serta **TimescaleDB** untuk data log sensor IoT) guna mengelola paspor digital komoditas, reservasi jam kedatangan pelabuhan (*virtual gate staging*), serta analitik arus barang daerah secara real-time.

---

## 2. Arsitektur Teknis & Tech Stack Backend

### Backend Architecture (Rust Engine)
- **Web Framework:** `Axum 0.7` (Async microservices berbasis runtime `Tokio` dengan overhead minimal).
- **Database Access:** `SQLx 0.7` (Async SQL client dengan evaluasi query terkompilasi / compile-time checking).
- **IoT Messaging Client:** `rumqttc` (Klien protocol MQTT async untuk streaming telemetry sensor).
- **Security & Auth:** `jsonwebtoken` (Ed25519 token signing) & `argon2` password hashing.

### Data Storage Layer (PostgreSQL Stack)
- **Relational Core:** `PostgreSQL 16` (Transaksi ACID & Multi-Tenant Schema).
- **Geospatial Engine:** `PostGIS 3.4` (Indexing spasial GIST & audit koordinat lahan EUDR).
- **Time-Series Engine:** `TimescaleDB` (Optimasi hypertable log sensor IoT cold-chain).
- **Caching & Message Queue:** `Redis 7` (Rate limiting, session management, & event dispatch).

---

## 3. Matriks Persyaratan Fungsional (Functional Requirements)

| ID | Modul Utama | Spesifikasi Fungsional & Logika Bisnis | Endpoint / Protocol | Prioritas |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | **Digital Batch Passport** | Generasi QR Code unik untuk setiap batch panen di kabupaten asal. Menyimpan sertifikat Phytosanitary, uji mutu, dan titik koordinat polygon lahan untuk audit EUDR. | `POST /api/v1/batches` | `P0 - Critical` |
| **FR-02** | **IoT Telemetry Ingest** | Menerima payload sensor GPS, suhu, kelembapan, dan status pintu truk tiap 10 detik via MQTT. Memicu alert otomatis jika suhu *cold-storage* menyimpang. | `MQTT /telemetry/{id}` | `P0 - Critical` |
| **FR-03** | **Virtual Gate Staging** | Reservasi slot kedatangan (*time-slot booking*) di Pelabuhan Panjang berdasarkan ETA kapal. Mengarahkan truk yang datang lebih awal ke *Buffer Zone* via geofencing. | `POST /api/v1/gate/reserve` | `P0 - Critical` |
| **FR-04** | **Hub Cross-Docking** | Manajemen kapasitas pergudangan kota dan fitur konsolidasi muatan skala kecil (*Less-than-Truckload* / LTL) antar-pengumpul. | `GET /api/v1/hubs/capacity` | `P1 - High` |
| **FR-05** | **Gov Analytics Center** | Executive Dashboard bagi Pemkot Bandar Lampung & Dinas Perdagangan untuk pemantauan volume ekspor, nilai transaksi, dan proyeksi PAD real-time. | `GET /api/v1/gov/dashboard` | `P1 - High` |

---

## 4. Spesifikasi Skema Database PostgreSQL / PostGIS DDL & Query Operasional (Refactored)

```sql
-- 1. Inisialisasi Ekstensi Database (Idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Tabel Batch Komoditas (Paspor Digital & EUDR EU Reg 2023/1115)
-- Refactored: qr_code_hash VARCHAR(66) ('0x' + 64 hex SHA-256), farm_polygon, & CHECK constraints
CREATE TABLE IF NOT EXISTS commodity_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code VARCHAR(32) UNIQUE NOT NULL,
    dds_reference VARCHAR(32) UNIQUE NOT NULL,
    qr_code_hash VARCHAR(66) UNIQUE NOT NULL
        CHECK (qr_code_hash ~ '^0x[a-fA-F0-9]{64}$'),
    commodity_type VARCHAR(32) NOT NULL
        CHECK (commodity_type IN ('KOPI_ROBUSTA', 'LADA_HITAM', 'KAKAO', 'CPO', 'KOPI_ARABIKA_ULUBELU')),
    weight_kg NUMERIC(12,2) NOT NULL CHECK (weight_kg > 0),
    exporter_name VARCHAR(128) NOT NULL,
    exporter_nib VARCHAR(32) NOT NULL,
    origin_district VARCHAR(128) NOT NULL,
    farm_origin_location GEOMETRY(Point, 4326) NOT NULL,
    farm_polygon GEOMETRY(Polygon, 4326)
        CHECK (farm_polygon IS NULL OR ST_IsValid(farm_polygon)),
    eudr_compliant BOOLEAN NOT NULL DEFAULT FALSE,
    eudr_status VARCHAR(24) NOT NULL DEFAULT 'VERIFIED'
        CHECK (eudr_status IN ('VERIFIED', 'UNDER_REVIEW', 'FLAGGED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batches_farm_loc ON commodity_batches USING GIST(farm_origin_location);
CREATE INDEX IF NOT EXISTS idx_batches_farm_polygon ON commodity_batches USING GIST(farm_polygon);

-- 3. Tabel Trip Logistik & Armada Reefer
CREATE TABLE IF NOT EXISTS transit_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES commodity_batches(id) ON DELETE RESTRICT,
    truck_plate_number VARCHAR(16) NOT NULL
        CHECK (truck_plate_number ~ '^BE [0-9]{3,4} [A-Z]{2}$'),
    driver_name VARCHAR(64) NOT NULL,
    driver_phone VARCHAR(24) NOT NULL,
    e_seal_id VARCHAR(32) UNIQUE NOT NULL,
    door_locked BOOLEAN NOT NULL DEFAULT TRUE,
    current_reefer_status VARCHAR(16) NOT NULL DEFAULT 'OPTIMAL'
        CHECK (current_reefer_status IN ('OPTIMAL', 'WARNING', 'EXCURSION')),
    status VARCHAR(32) NOT NULL DEFAULT 'IN_TRANSIT'
        CHECK (status IN ('IN_TRANSIT', 'BUFFER_HOLDING', 'IN_INSPECTION', 'APPROVED', 'DIVERTED', 'REJECTED')),
    destination_hub VARCHAR(64) NOT NULL,
    target_gate VARCHAR(32) NOT NULL DEFAULT 'Gate 2 (Fast-Track)',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Log Telemetry IoT (TimescaleDB Hypertable)
CREATE TABLE IF NOT EXISTS iot_telemetry_logs (
    recorded_at TIMESTAMPTZ NOT NULL,
    trip_id UUID NOT NULL REFERENCES transit_trips(id) ON DELETE CASCADE,
    current_location GEOMETRY(Point, 4326) NOT NULL,
    speed_kmh REAL NOT NULL DEFAULT 0.0 CHECK (speed_kmh >= 0.0),
    temperature_c REAL NOT NULL CHECK (temperature_c BETWEEN -30.0 AND 60.0),
    humidity_pct REAL NOT NULL CHECK (humidity_pct BETWEEN 0.0 AND 100.0)
);
SELECT create_hypertable('iot_telemetry_logs', 'recorded_at', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_telemetry_trip_time ON iot_telemetry_logs (trip_id, recorded_at DESC);

-- 5. Query Ingesti Telemetri Atomik (CTE) dengan Urutan Koordinat PostGIS ST_MakePoint(longitude, latitude)
WITH inserted_telemetry AS (
    INSERT INTO iot_telemetry_logs (
        recorded_at, trip_id, current_location, speed_kmh, temperature_c, humidity_pct
    )
    VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7
    )
    RETURNING trip_id, temperature_c, recorded_at
)
UPDATE transit_trips t
SET
    current_reefer_status = CASE
        WHEN it.temperature_c > 22.0 THEN 'EXCURSION'
        WHEN it.temperature_c > 20.0 THEN 'WARNING'
        ELSE 'OPTIMAL'
    END,
    updated_at = it.recorded_at
FROM inserted_telemetry it
WHERE t.id = it.trip_id
RETURNING t.id AS trip_id, t.truck_plate_number, t.current_reefer_status;
```

---

## 5. Spesifikasi Struct Data & Validasi Rust (Backend DTO — Refactored)

```rust
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;
use chrono::{DateTime, Utc};

pub const REEFER_MAX_TEMP_C: f32 = 22.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ReeferState {
    Optimal,
    Warning,
    Excursion,
}

/// Payload DTO untuk ingesti telemetri sensor IoT cold-chain (Refactored & Validated)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryPayload {
    pub trip_id: Uuid,
    pub latitude: f64,
    pub longitude: f64,
    pub speed_kmh: f32,
    pub temperature_c: f32,
    pub humidity_pct: f32,
    pub timestamp: DateTime<Utc>,
}

impl TelemetryPayload {
    pub fn evaluate_state(&self) -> Result<ReeferState, &'static str> {
        if !(-6.0..=-4.5).contains(&self.latitude) || !(103.5..=106.0).contains(&self.longitude) {
            return Err("Koordinat GPS di luar koridor Provinsi Lampung");
        }
        if !(0.0..=100.0).contains(&self.humidity_pct) {
            return Err("Persentase kelembapan di luar batas 0..100%");
        }
        Ok(if self.temperature_c > REEFER_MAX_TEMP_C {
            ReeferState::Excursion
        } else if self.temperature_c > 20.0 {
            ReeferState::Warning
        } else {
            ReeferState::Optimal
        })
    }
}

/// DTO untuk pembuatan batch komoditas baru (EUDR compliance & SHA-256 PostGIS Hash)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBatchRequest {
    pub batch_code: String,
    pub dds_reference: String,
    pub commodity_type: String,
    pub exporter_name: String,
    pub exporter_nib: String,
    pub origin_district: String,
    pub weight_kg: f64,
    pub latitude: f64,
    pub longitude: f64,
    pub polygon_lat_lng: Option<Vec<[f64; 2]>>,
    pub eudr_compliant: bool,
}

impl CreateBatchRequest {
    pub fn compute_postgis_state_hash(&self) -> String {
        let canonical = format!(
            "batch={}|dds={}|commodity={}|exporter={}|weight={:.2}|lat={:.6}|lng={:.6}|eudr={}",
            self.batch_code.trim(),
            self.dds_reference.trim(),
            self.commodity_type.trim(),
            self.exporter_name.trim(),
            self.weight_kg,
            self.latitude,
            self.longitude,
            self.eudr_compliant
        );
        format!("0x{}", hex::encode(Sha256::digest(canonical.as_bytes())))
    }
}
```

---

## 6. Persyaratan Non-Fungsional & Metrik Keberhasilan

### Performa Backend Rust
- **Throughput Engine:** Minimal **15.000 req/detik** pada spesifikasi server 8-core CPU / 16GB RAM.
- **Latency API:** Latensi `p99 < 12ms` untuk endpoint ingesti telemetri IoT.
- **Security Standard:** Implementasi Ed25519 digital signature untuk QR paspor dan enkripsi data in-transit menggunakan TLS 1.3.

### Target Indikator Kinerja (KPI)
- **Waktu Antrean Pelabuhan:** Pangkas waktu tunggu truk dari 6 jam menjadi **< 45 menit**.
- **Mutu Transit:** Tekan angka kerugian/penyusutan barang dari 10% menjadi **< 2.0%**.
- **Kepatuhan EUDR:** Validasi 100% asal-usul koordinat lahan panen untuk ekspor Eropa.

---

## 7. Lembar Pengesahan Dokumen

| Pemkab / Pemkot Bandar Lampung | Universitas Teknokrat Indonesia |
| :--- | :--- |
| **Dinas Perhubungan & Perdagangan** | **Tim Peneliti & Pengembang** |
| *(Tanda Tangan & Stempel Resmi)* | *(Tanda Tangan & Stempel Resmi)* |
| **Nama:** _______________________ | **Nama:** Dr. Erliyan Redy Susanto, M.Kom |

---

### Meta & Hak Cipta
- **Pemerintah Kota Bandar Lampung** | **Universitas Teknokrat Indonesia**
- `Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom`