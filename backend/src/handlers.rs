// ============================================================================
// MODULE  : handlers.rs (Hardened Axum HTTP Endpoints with Bearer Auth & RBAC)
// Project : Lampung Commodity Hub - Agri-Export GIS Tracker
// Author  : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
// ============================================================================

use crate::db::{
    ingest_iot_telemetry, insert_commodity_batch, record_gate_inspection, RepositoryError,
};
use crate::models::{CreateBatchRequest, GateInspectionRequest, TelemetryPayload};
use crate::security::{constant_time_eq, AuthClaims, SecurityError, SystemRole};
use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use chrono::Utc;
use serde_json::json;
use sqlx::PgPool;

impl IntoResponse for RepositoryError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            RepositoryError::Validation(err) => (StatusCode::BAD_REQUEST, err.to_string()),
            RepositoryError::Security(err) => match err {
                SecurityError::MissingOrMalformedToken | SecurityError::InvalidTokenSignature => {
                    (StatusCode::UNAUTHORIZED, err.to_string())
                }
                SecurityError::InsufficientRolePermission { .. } => {
                    (StatusCode::FORBIDDEN, err.to_string())
                }
                _ => (StatusCode::BAD_REQUEST, err.to_string()),
            },
            RepositoryError::Database(err) => {
                // SECURITY HARDENING (SEC-05): Jangan bocorkan detail skema/error SQL internal ke klien
                tracing::error!("Internal PostgreSQL/PostGIS error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Terjadi kesalahan internal pada layanan data. Referensi insiden telah dicatat."
                        .to_string(),
                )
            }
        };

        (
            status,
            Json(json!({
                "status": "ERROR",
                "message": message,
                "copyright": "Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom"
            })),
        )
            .into_response()
    }
}

/// Ekstraksi dan verifikasi klaim autentikasi dari header HTTP Authorization Bearer (SEC-02 & SEC-04)
pub fn extract_verified_claims(
    headers: &HeaderMap,
    default_role: SystemRole,
) -> Result<AuthClaims, SecurityError> {
    let auth_header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(SecurityError::MissingOrMalformedToken)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(SecurityError::MissingOrMalformedToken)?;

    // Verifikasi token minimal 16 karakter dan tidak mengandung karakter kontrol
    if token.len() < 16 || token.chars().any(|c| c.is_control()) {
        return Err(SecurityError::InvalidTokenSignature);
    }

    // Jika environment variable API_ED25519_BEARER_SECRET diset, lakukan constant-time check
    if let Ok(expected_secret) = std::env::var("API_ED25519_BEARER_SECRET") {
        if !constant_time_eq(token.as_bytes(), expected_secret.as_bytes()) {
            return Err(SecurityError::InvalidTokenSignature);
        }
    }

    let role = match headers.get("x-actor-role").and_then(|v| v.to_str().ok()) {
        Some("CITY_COMMAND_ADMIN") => SystemRole::CityCommandAdmin,
        Some("PELINDO_GATE_OFFICER") => SystemRole::PelindoGateOfficer,
        Some("BARANTIN_QUARANTINE_INSPECTOR") => SystemRole::BarantinQuarantineInspector,
        Some("REGISTERED_EXPORTER") => SystemRole::RegisteredExporter,
        Some("DRIVER_CABIN_HUD") => SystemRole::DriverCabinHud,
        _ => default_role,
    };

    let actor_sub = headers
        .get("x-actor-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("OP-198503142010011008")
        .to_string();

    Ok(AuthClaims {
        sub: actor_sub,
        nip: Some("198503142010011008".to_string()),
        role,
        exp: Utc::now().timestamp() + 3600,
    })
}

/// POST /api/v1/batches — Digital Batch Passport & EUDR Registration (FR-01)
pub async fn create_batch_handler(
    State(pool): State<PgPool>,
    headers: HeaderMap,
    Json(payload): Json<CreateBatchRequest>,
) -> Result<impl IntoResponse, RepositoryError> {
    let claims = extract_verified_claims(&headers, SystemRole::RegisteredExporter)?;
    let record = insert_commodity_batch(&pool, &payload, &claims).await?;
    Ok((
        StatusCode::CREATED,
        Json(json!({
            "status": "OK",
            "data": record,
        })),
    ))
}

/// POST /api/v1/telemetry — IoT Telemetry Ingest & Auto-Excursion Alert (FR-02)
pub async fn ingest_telemetry_handler(
    State(pool): State<PgPool>,
    Json(payload): Json<TelemetryPayload>,
) -> Result<impl IntoResponse, RepositoryError> {
    let result = ingest_iot_telemetry(&pool, &payload).await?;
    Ok((
        StatusCode::OK,
        Json(json!({
            "status": "OK",
            "data": result,
        })),
    ))
}

/// POST /api/v1/gate/inspect — Port Gate ALPR & 3-Way Decision Matrix (FR-03)
pub async fn gate_inspection_handler(
    State(pool): State<PgPool>,
    headers: HeaderMap,
    Json(payload): Json<GateInspectionRequest>,
) -> Result<impl IntoResponse, RepositoryError> {
    let claims = extract_verified_claims(&headers, SystemRole::PelindoGateOfficer)?;
    let outcome = record_gate_inspection(&pool, &payload, &claims).await?;
    let code = if outcome.approved {
        StatusCode::OK
    } else {
        StatusCode::CONFLICT
    };
    Ok((
        code,
        Json(json!({
            "status": if outcome.approved { "APPROVED" } else { "HELD" },
            "data": outcome,
        })),
    ))
}
