// ============================================================================
// MODULE  : db.rs (Hardened SQLx + PostGIS + RLS + Immutable Audit Trail)
// Project : Lampung Commodity Hub - Agri-Export GIS Tracker
// Author  : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
// ============================================================================

use crate::models::{
    evaluate_gate_decision, CreateBatchRequest, DomainValidationError, GateDecisionOutcome,
    GateInspectionRequest, ReeferState, TelemetryPayload,
};
use crate::security::{
    authorize_gate_decision, compute_security_audit_digest, AuthClaims, SecurityError,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum RepositoryError {
    #[error("Validasi domain gagal: {0}")]
    Validation(#[from] DomainValidationError),

    #[error("Pelanggaran kontrol keamanan / RBAC: {0}")]
    Security(#[from] SecurityError),

    #[error("Kesalahan eksekusi database PostgreSQL/PostGIS: {0}")]
    Database(#[from] sqlx::Error),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatedBatchRecord {
    pub id: Uuid,
    pub batch_code: String,
    pub dds_reference: String,
    pub qr_code_hash: String,
    pub latitude: f64,
    pub longitude: f64,
    pub eudr_status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetryIngestResult {
    pub trip_id: Uuid,
    pub reefer_status: String,
    pub incident_triggered: bool,
    pub incident_code: Option<String>,
}

/// 1. Simpan Batch Komoditas Baru ke PostGIS dengan RLS Context & Immutable Audit Trail
///    (Hardened SEC-01, SEC-02, SEC-04)
pub async fn insert_commodity_batch(
    pool: &PgPool,
    req: &CreateBatchRequest,
    claims: &AuthClaims,
) -> Result<CreatedBatchRecord, RepositoryError> {
    req.validate()?;

    let qr_code_hash = req.compute_postgis_state_hash();
    let geojson_polygon = req.to_geojson_polygon_string();
    let mut tx = pool.begin().await?;

    // Aktifkan konteks peran pengguna untuk Row-Level Security (RLS) PostgreSQL
    sqlx::query("SELECT set_config('app.current_user_role', $1, TRUE)")
        .bind(claims.role.as_str())
        .execute(&mut *tx)
        .await?;

    let row = sqlx::query(
        r#"
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
            $1, $2, $3, $4, $5, $6, $7,
            ST_SetSRID(ST_MakePoint($8, $9), 4326),
            CASE
                WHEN $10::TEXT IS NOT NULL THEN ST_SetSRID(ST_GeomFromGeoJSON($10), 4326)
                ELSE NULL
            END,
            $11,
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
            eudr_status
        "#,
    )
    .bind(&req.batch_code)
    .bind(&req.dds_reference)
    .bind(&qr_code_hash)
    .bind(&req.commodity_type)
    .bind(req.weight_kg)
    .bind(&req.exporter_name)
    .bind(&req.exporter_nib)
    .bind(req.longitude) // $8: X = Longitude
    .bind(req.latitude)  // $9: Y = Latitude
    .bind(geojson_polygon)
    .bind(&req.origin_district)
    .bind(req.eudr_compliant)
    .fetch_one(&mut *tx)
    .await?;

    // Catat ke tabel append-only security_audit_logs
    let now_iso = Utc::now().to_rfc3339();
    let audit_digest = compute_security_audit_digest(
        &claims.sub,
        "CREATE_COMMODITY_BATCH",
        &req.batch_code,
        &now_iso,
    );

    sqlx::query(
        r#"
        INSERT INTO security_audit_logs (
            actor_id,
            actor_role,
            action_type,
            target_resource,
            client_ip,
            audit_digest_sha256
        )
        VALUES ($1, $2, 'CREATE_COMMODITY_BATCH', $3, '127.0.0.1', $4)
        "#,
    )
    .bind(&claims.sub)
    .bind(claims.role.as_str())
    .bind(&req.batch_code)
    .bind(&audit_digest)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(CreatedBatchRecord {
        id: row.get("id"),
        batch_code: row.get("batch_code"),
        dds_reference: row.get("dds_reference"),
        qr_code_hash: row.get("qr_code_hash"),
        latitude: row.get("latitude"),
        longitude: row.get("longitude"),
        eudr_status: row.get("eudr_status"),
    })
}

/// 2. Ingesti Telemetri IoT dalam Transaksi Atomik + Eskalasi Insiden Otomatis
pub async fn ingest_iot_telemetry(
    pool: &PgPool,
    payload: &TelemetryPayload,
) -> Result<TelemetryIngestResult, RepositoryError> {
    let reefer_state = payload.validate()?;
    let mut tx = pool.begin().await?;

    sqlx::query(
        r#"
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
        "#,
    )
    .bind(payload.timestamp)
    .bind(payload.trip_id)
    .bind(payload.longitude) // $3 = Longitude
    .bind(payload.latitude)  // $4 = Latitude
    .bind(payload.speed_kmh)
    .bind(payload.temperature_c)
    .bind(payload.humidity_pct)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        UPDATE transit_trips
        SET current_reefer_status = $1,
            updated_at = $2
        WHERE id = $3
        "#,
    )
    .bind(reefer_state.as_str())
    .bind(payload.timestamp)
    .bind(payload.trip_id)
    .execute(&mut *tx)
    .await?;

    let mut incident_triggered = false;
    let mut incident_code: Option<String> = None;

    if reefer_state == ReeferState::Excursion {
        let code = format!(
            "#INC-TEMP-{}",
            &payload.trip_id.simple().to_string()[..4].to_uppercase()
        );
        let detected_val = format!("+{:.1}°C (Batas Maks 22.0°C)", payload.temperature_c);

        sqlx::query(
            r#"
            INSERT INTO cold_chain_incidents (
                incident_code,
                trip_id,
                incident_type,
                severity,
                status,
                detected_value,
                location_label,
                iot_diagnostic
            )
            VALUES ($1, $2, 'TEMP_EXCURSION', 'CRITICAL', 'ACTIVE', $3, $4, $5)
            ON CONFLICT (incident_code) DO NOTHING
            "#,
        )
        .bind(&code)
        .bind(payload.trip_id)
        .bind(&detected_val)
        .bind("Koridor JTTS – Pelabuhan Panjang")
        .bind("Auxiliary Power Unit Fault / Anomali Suhu Reefer")
        .execute(&mut *tx)
        .await?;

        incident_triggered = true;
        incident_code = Some(code);
    }

    tx.commit().await?;

    Ok(TelemetryIngestResult {
        trip_id: payload.trip_id,
        reefer_status: reefer_state.as_str().to_string(),
        incident_triggered,
        incident_code,
    })
}

/// 3. Simpan Keputusan Inspeksi Gerbang Pelabuhan dengan Verifikasi RBAC, NIP, RLS, & Audit Log
///    (Hardened SEC-01, SEC-02, SEC-03)
pub async fn record_gate_inspection(
    pool: &PgPool,
    req: &GateInspectionRequest,
    claims: &AuthClaims,
) -> Result<GateDecisionOutcome, RepositoryError> {
    // 1. Verifikasi izin peran RBAC (Hanya Petugas Pelindo / Barantin / Admin)
    authorize_gate_decision(claims)?;

    // 2. Validasi input termasuk format NIP 18 digit numerik & sanitasi string
    req.validate()?;

    let outcome = evaluate_gate_decision(req);
    let mut tx = pool.begin().await?;

    // 3. Aktifkan konteks peran Row-Level Security (RLS) PostgreSQL
    sqlx::query("SELECT set_config('app.current_user_role', $1, TRUE)")
        .bind(claims.role.as_str())
        .execute(&mut *tx)
        .await?;

    let decision_str = match outcome.final_decision {
        crate::models::GateDecision::Approve => "APPROVE",
        crate::models::GateDecision::Divert => "DIVERT",
        crate::models::GateDecision::Reject => "REJECT",
    };

    let trip_status = match outcome.final_decision {
        crate::models::GateDecision::Approve => "APPROVED",
        crate::models::GateDecision::Divert => "DIVERTED",
        crate::models::GateDecision::Reject => "REJECTED",
    };

    sqlx::query(
        r#"
        INSERT INTO gate_inspections (
            trip_id,
            queue_number,
            time_slot,
            alpr_matched,
            ocr_confidence_pct,
            qr_token_valid,
            e_seal_integrity,
            weighbridge_gross_kg,
            weighbridge_net_kg,
            weight_variance_pct,
            decision,
            lane_action,
            inspected_by_nip
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        "#,
    )
    .bind(req.trip_id)
    .bind(req.queue_number)
    .bind(&req.time_slot)
    .bind(req.alpr_matched)
    .bind(req.ocr_confidence_pct)
    .bind(req.qr_token_valid)
    .bind(&req.e_seal_integrity)
    .bind(req.weighbridge_gross_kg)
    .bind(req.weighbridge_net_kg)
    .bind(req.weight_variance_pct)
    .bind(decision_str)
    .bind(&outcome.lane_action)
    .bind(&req.officer_nip)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        UPDATE transit_trips
        SET status = $1,
            updated_at = NOW()
        WHERE id = $2
        "#,
    )
    .bind(trip_status)
    .bind(req.trip_id)
    .execute(&mut *tx)
    .await?;

    // 4. Catat keputusan gerbang ke immutable security_audit_logs
    let now_iso = Utc::now().to_rfc3339();
    let audit_digest = compute_security_audit_digest(
        &req.officer_nip,
        &outcome.lane_action,
        &req.trip_id.to_string(),
        &now_iso,
    );

    sqlx::query(
        r#"
        INSERT INTO security_audit_logs (
            actor_id,
            actor_role,
            action_type,
            target_resource,
            client_ip,
            audit_digest_sha256
        )
        VALUES ($1, $2, $3, $4, '127.0.0.1', $5)
        "#,
    )
    .bind(&req.officer_nip)
    .bind(claims.role.as_str())
    .bind(&outcome.lane_action)
    .bind(req.trip_id.to_string())
    .bind(&audit_digest)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(outcome)
}
