-- ============================================================================
-- MIGRATION 002: REFACTORED OPERATIONAL QUERIES & SPATIAL FUNCTIONS (POSTGIS)
-- Project : Lampung Commodity Hub - Agri-Export GIS Tracker
-- Author  : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: Insert Batch Komoditas Baru + Validasi Urutan Koordinat PostGIS
-- PERBAIKAN (FIX SQL-01):
--   ST_MakePoint(x, y) di PostGIS wajib menerima (longitude, latitude),
--   BUKAN (latitude, longitude). Parameter $8 = longitude, $9 = latitude.
-- ----------------------------------------------------------------------------
-- $1: batch_code, $2: dds_reference, $3: qr_code_hash, $4: commodity_type,
-- $5: weight_kg, $6: exporter_name, $7: exporter_nib, $8: longitude, $9: latitude,
-- $10: origin_district, $11: geojson_polygon, $12: eudr_compliant
INSERT INTO commodity_batches (
    batch_code,
    dds_reference,
    qr_code_hash,
    commodity_type,
    weight_kg,
    exporter_name,
    exporter_nib,
    farm_origin_location,
    farm_polygon,
    origin_district,
    eudr_compliant,
    eudr_status
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    ST_SetSRID(ST_MakePoint($8, $9), 4326),
    CASE
        WHEN $11::TEXT IS NOT NULL THEN ST_SetSRID(ST_GeomFromGeoJSON($11), 4326)
        ELSE NULL
    END,
    $10,
    $12,
    CASE WHEN $12 = TRUE THEN 'VERIFIED' ELSE 'UNDER_REVIEW' END
)
RETURNING
    id,
    batch_code,
    dds_reference,
    qr_code_hash,
    ST_Y(farm_origin_location) AS latitude,
    ST_X(farm_origin_location) AS longitude,
    eudr_status,
    created_at;

-- ----------------------------------------------------------------------------
-- QUERY 2: Ingesti Telemetri IoT & Deteksi Excursion Suhu Otomatis (> 22.0 C)
-- PERBAIKAN (FIX SQL-03 & SQL-04):
--   Menggunakan CTE atomik (WITH ... INSERT ... UPDATE) sehingga pencatatan
--   titik GPS (ST_MakePoint(longitude, latitude)) dan pembaruan status reefer
--   (OPTIMAL vs EXCURSION) dieksekusi dalam satu transaksi konsisten.
-- ----------------------------------------------------------------------------
-- $1: recorded_at, $2: trip_id, $3: longitude, $4: latitude,
-- $5: speed_kmh, $6: temperature_c, $7: humidity_pct
WITH inserted_telemetry AS (
    INSERT INTO iot_telemetry_logs (
        recorded_at,
        trip_id,
        current_location,
        speed_kmh,
        temperature_c,
        humidity_pct
    )
    VALUES (
        $1,
        $2,
        ST_SetSRID(ST_MakePoint($3, $4), 4326),
        $5,
        $6,
        $7
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
RETURNING
    t.id AS trip_id,
    t.truck_plate_number,
    t.batch_id,
    t.current_reefer_status;

-- ----------------------------------------------------------------------------
-- QUERY 3: Audit Spasial EUDR (Overlap Hutan Lindung TNBBS & Jarak Buffer)
-- Menghitung apakah poligon kebun bebas dari kawasan hutan lindung (0.00 Ha)
-- dan menghitung jarak meter terdekat menggunakan ST_DistanceSphere.
-- ----------------------------------------------------------------------------
-- $1: batch_code, $2: tnbbs_protected_wkt
SELECT
    b.batch_code,
    b.dds_reference,
    b.qr_code_hash,
    ST_IsValid(b.farm_polygon) AS polygon_valid,
    NOT ST_Intersects(
        COALESCE(b.farm_polygon, b.farm_origin_location),
        ST_GeomFromText($2, 4326)
    ) AS zero_deforestation_verified,
    ROUND(
        (ST_DistanceSphere(
            b.farm_origin_location,
            ST_GeomFromText($2, 4326)
        ) / 1000.0)::NUMERIC,
        2
    ) AS buffer_distance_km
FROM commodity_batches b
WHERE b.batch_code = $1;

-- ----------------------------------------------------------------------------
-- QUERY 4: Agregasi Executive Dashboard & TimescaleDB Cold-Chain Metrics (FR-05)
-- PERBAIKAN: Menggunakan COALESCE dan NULLIF agar bebas division-by-zero
-- saat tabel baru diinisialisasi (kosong).
-- ----------------------------------------------------------------------------
SELECT
    COALESCE(SUM(b.weight_kg) / 1000.0, 0.00) AS total_export_volume_mt,
    COUNT(DISTINCT b.id) AS total_batches,
    ROUND(
        COALESCE(
            (COUNT(b.id) FILTER (WHERE b.eudr_compliant = TRUE)::NUMERIC /
             NULLIF(COUNT(b.id), 0)::NUMERIC) * 100.0,
            100.0
        ),
        1
    ) AS eudr_compliance_rate_pct,
    (
        SELECT COUNT(*)
        FROM cold_chain_incidents cci
        WHERE cci.status IN ('ACTIVE', 'DISPATCHED')
    ) AS active_cold_chain_excursions
FROM commodity_batches b
WHERE b.created_at >= NOW() - INTERVAL '24 hours';

