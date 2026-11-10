-- ============================================================================
-- MIGRATION 001: REFACTORED POSTGRESQL 16 + POSTGIS 3.4 + TIMESCALEDB SCHEMA
-- Project : Lampung Commodity Hub - Agri-Export GIS Tracker
-- Author  : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
-- ============================================================================

-- 1. Inisialisasi Ekstensi Database (Idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Tabel Batch Komoditas (Paspor Digital & Kepatuhan EUDR EU Reg 2023/1115)
-- PERBAIKAN (FIX SQL-01 & SQL-02):
--   a) Panjang qr_code_hash diperbesar dari VARCHAR(64) menjadi VARCHAR(66)
--      agar mengakomodasi prefiks '0x' + 64 karakter hex SHA-256 (sesuai TC-DOM-05).
--   b) Ditambahkan kolom farm_polygon GEOMETRY(Polygon, 4326) untuk audit spasial
--      lahan > 4 Ha dengan validasi ST_IsValid(farm_polygon).
--   c) Ditambahkan CHECK constraint pada weight_kg (> 0) dan commodity_type.
CREATE TABLE IF NOT EXISTS commodity_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code VARCHAR(32) UNIQUE NOT NULL,
    dds_reference VARCHAR(32) UNIQUE NOT NULL,
    qr_code_hash VARCHAR(66) UNIQUE NOT NULL
        CHECK (qr_code_hash ~ '^0x[a-fA-F0-9]{64}$'),
    commodity_type VARCHAR(32) NOT NULL
        CHECK (commodity_type IN ('KOPI_ROBUSTA', 'LADA_HITAM', 'KAKAO', 'CPO', 'KOPI_ARABIKA_ULUBELU')),
    weight_kg NUMERIC(12, 2) NOT NULL
        CHECK (weight_kg > 0),
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

CREATE INDEX IF NOT EXISTS idx_batches_farm_loc
    ON commodity_batches USING GIST (farm_origin_location);

CREATE INDEX IF NOT EXISTS idx_batches_farm_polygon
    ON commodity_batches USING GIST (farm_polygon);

-- 3. Tabel Trip Logistik & Armada Reefer
-- PERBAIKAN:
--   a) Validasi format plat nomor Lampung (BE XXXX YY) dan status reefer.
--   b) Penambahan kolom e_seal_id, door_locked, dan current_reefer_status.
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

CREATE INDEX IF NOT EXISTS idx_trips_batch_id ON transit_trips(batch_id);
CREATE INDEX IF NOT EXISTS idx_trips_plate ON transit_trips(truck_plate_number);

-- 4. Tabel Log Telemetry IoT (TimescaleDB Hypertable)
-- PERBAIKAN (FIX SQL-03):
--   a) Penambahan CHECK constraint rentang suhu (-30..60 C) dan kelembapan (0..100%).
--   b) Inisialisasi create_hypertable dengan if_not_exists => TRUE dan composite index.
CREATE TABLE IF NOT EXISTS iot_telemetry_logs (
    recorded_at TIMESTAMPTZ NOT NULL,
    trip_id UUID NOT NULL REFERENCES transit_trips(id) ON DELETE CASCADE,
    current_location GEOMETRY(Point, 4326) NOT NULL,
    speed_kmh REAL NOT NULL DEFAULT 0.0 CHECK (speed_kmh >= 0.0),
    temperature_c REAL NOT NULL CHECK (temperature_c BETWEEN -30.0 AND 60.0),
    humidity_pct REAL NOT NULL CHECK (humidity_pct BETWEEN 0.0 AND 100.0)
);

SELECT create_hypertable('iot_telemetry_logs', 'recorded_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_telemetry_trip_time
    ON iot_telemetry_logs (trip_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_location
    ON iot_telemetry_logs USING GIST (current_location);

-- 5. Tabel Insiden Cold-Chain & Geofence (Mendukung FR-02 & TC-INT-01..03)
CREATE TABLE IF NOT EXISTS cold_chain_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_code VARCHAR(32) UNIQUE NOT NULL,
    trip_id UUID NOT NULL REFERENCES transit_trips(id) ON DELETE CASCADE,
    incident_type VARCHAR(32) NOT NULL
        CHECK (incident_type IN ('TEMP_EXCURSION', 'ROUTE_DEVIATION', 'SEAL_TAMPER', 'CONGESTION')),
    severity VARCHAR(16) NOT NULL
        CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'DISPATCHED', 'MITIGATED', 'RESOLVED')),
    detected_value VARCHAR(64) NOT NULL,
    location_label VARCHAR(128) NOT NULL,
    iot_diagnostic TEXT NOT NULL,
    sop_dispatched_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_trip_status
    ON cold_chain_incidents (trip_id, status);

-- 6. Tabel Inspeksi Gerbang Pelabuhan & ALPR (Mendukung FR-03 & TC-GATE-01..05)
CREATE TABLE IF NOT EXISTS gate_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES transit_trips(id) ON DELETE CASCADE,
    queue_number INTEGER NOT NULL CHECK (queue_number > 0),
    time_slot VARCHAR(32) NOT NULL,
    alpr_matched BOOLEAN NOT NULL,
    ocr_confidence_pct NUMERIC(5, 2) NOT NULL CHECK (ocr_confidence_pct BETWEEN 0.0 AND 100.0),
    qr_token_valid BOOLEAN NOT NULL,
    e_seal_integrity VARCHAR(16) NOT NULL CHECK (e_seal_integrity IN ('SECURE', 'TAMPERED')),
    weighbridge_gross_kg NUMERIC(12, 2) NOT NULL CHECK (weighbridge_gross_kg > 0),
    weighbridge_net_kg NUMERIC(12, 2) NOT NULL CHECK (weighbridge_net_kg > 0),
    weight_variance_pct NUMERIC(5, 2) NOT NULL CHECK (weight_variance_pct >= 0.0),
    decision VARCHAR(16) NOT NULL CHECK (decision IN ('APPROVE', 'DIVERT', 'REJECT')),
    lane_action VARCHAR(32) NOT NULL,
    inspected_by_nip VARCHAR(32) NOT NULL,
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

