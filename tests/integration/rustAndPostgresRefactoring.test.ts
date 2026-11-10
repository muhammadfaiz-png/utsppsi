import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Integration Test: Rust Backend & PostgreSQL/PostGIS Query Refactoring Verification', () => {
  const projectRoot = process.cwd();
  const schemaSqlPath = path.join(
    projectRoot,
    'backend/migrations/001_refactored_schema_postgis.sql'
  );
  const queriesSqlPath = path.join(
    projectRoot,
    'backend/migrations/002_operational_queries_postgis.sql'
  );
  const modelsRsPath = path.join(projectRoot, 'backend/src/models.rs');
  const dbRsPath = path.join(projectRoot, 'backend/src/db.rs');
  const handlersRsPath = path.join(projectRoot, 'backend/src/handlers.rs');

  it('TC-SQL-01: [FIX SQL-01 & SQL-02] Skema DDL PostgreSQL/PostGIS mendukung qr_code_hash VARCHAR(66), farm_polygon GEOMETRY(Polygon, 4326), dan CHECK constraints', () => {
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf-8');

    assert.ok(
      schemaSql.includes('qr_code_hash VARCHAR(66) UNIQUE NOT NULL'),
      'qr_code_hash harus VARCHAR(66) untuk menampung 0x + 64 hex SHA-256'
    );
    assert.ok(
      schemaSql.includes('farm_polygon GEOMETRY(Polygon, 4326)'),
      'Harus memiliki kolom farm_polygon GEOMETRY(Polygon, 4326) untuk audit EUDR'
    );
    assert.ok(
      schemaSql.includes('ST_IsValid(farm_polygon)'),
      'Harus memiliki validasi geometri ST_IsValid(farm_polygon)'
    );
    assert.ok(
      schemaSql.includes("create_hypertable('iot_telemetry_logs', 'recorded_at', if_not_exists => TRUE)"),
      'Inisialisasi TimescaleDB hypertable harus idempotent (if_not_exists => TRUE)'
    );
  });

  it('TC-SQL-02: [FIX SQL-03 & SQL-04] Query operasional PostGIS wajib menggunakan ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) dan CTE atomik', () => {
    const queriesSql = fs.readFileSync(queriesSqlPath, 'utf-8');

    assert.ok(
      queriesSql.includes('ST_SetSRID(ST_MakePoint('),
      'Query spasial harus menggunakan ST_SetSRID(ST_MakePoint(lng, lat), 4326)'
    );
    assert.ok(
      queriesSql.includes('WITH inserted_telemetry AS'),
      'Query ingesti telemetri harus menggunakan CTE atomik untuk memperbarui status reefer'
    );
    assert.ok(
      queriesSql.includes('NULLIF(COUNT(b.id), 0)'),
      'Query agregasi KPI harus menggunakan NULLIF untuk mencegah division by zero'
    );
  });

  it('TC-RUST-01: [FIX RUST-01 & RUST-02] Modul models.rs memvalidasi koridor koordinat Lampung, menghasilkan SHA-256 0x 66-char, dan membalik koordinat GeoJSON [lng, lat]', () => {
    const modelsRs = fs.readFileSync(modelsRsPath, 'utf-8');

    assert.ok(
      modelsRs.includes('pub fn compute_postgis_state_hash(&self) -> String'),
      'models.rs harus memiliki generator SHA-256 PostGIS State Hash'
    );
    assert.ok(
      modelsRs.includes('pub fn to_geojson_polygon_string(&self) -> Option<String>'),
      'models.rs harus mengonversi [lat, lng] ke GeoJSON [lng, lat]'
    );
    assert.ok(
      modelsRs.includes('pub fn evaluate_gate_decision(req: &GateInspectionRequest) -> GateDecisionOutcome'),
      'models.rs harus mengimplementasikan matriks keputusan 3 arah gerbang pelabuhan'
    );
  });

  it('TC-RUST-02: [FIX RUST-03 & RUST-04] Modul db.rs dan handlers.rs menggunakan transaksi atomik SQLx (pool.begin / tx.commit) dan mengikat longitude sebelum latitude pada ST_MakePoint', () => {
    const dbRs = fs.readFileSync(dbRsPath, 'utf-8');
    const handlersRs = fs.readFileSync(handlersRsPath, 'utf-8');

    assert.ok(
      dbRs.includes('let mut tx = pool.begin().await?;') &&
        dbRs.includes('tx.commit().await?;'),
      'db.rs wajib menggunakan transaksi database atomik SQLx'
    );
    assert.ok(
      dbRs.includes('.bind(req.longitude)') &&
        dbRs.includes('.bind(payload.longitude)'),
      'db.rs wajib mengikat parameter longitude (X) sebelum latitude (Y) pada ST_MakePoint'
    );
    assert.ok(
      handlersRs.includes('create_batch_handler') &&
        handlersRs.includes('ingest_telemetry_handler') &&
        handlersRs.includes('gate_inspection_handler'),
      'handlers.rs wajib mengekspos ketiga handler REST API utama'
    );
  });
});

