// ============================================================================
// MODULE  : main.rs (Axum Entrypoint & Unit Tests for Refactored Rust Logic)
// Project : Lampung Commodity Hub - Agri-Export GIS Tracker
// Author  : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
// ============================================================================

pub mod db;
pub mod handlers;
pub mod models;
pub mod security;

use axum::{
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgres@localhost:5432/lampung_commodity_hub".to_string()
    });

    let pool = PgPoolOptions::new()
        .max_connections(32)
        .connect_lazy(&database_url)?;

    let app = Router::new()
        .route(
            "/api/v1/health",
            get(|| async {
                Json(json!({
                    "service": "Lampung Commodity Hub - Rust Axum & PostGIS Engine",
                    "status": "ACTIVE",
                    "copyright": "Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom"
                }))
            }),
        )
        .route("/api/v1/batches", post(handlers::create_batch_handler))
        .route("/api/v1/telemetry", post(handlers::ingest_telemetry_handler))
        .route(
            "/api/v1/gate/inspect",
            post(handlers::gate_inspection_handler),
        )
        .with_state(pool);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Lampung Commodity Hub Rust Engine listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::models::*;
    use chrono::Utc;
    use uuid::Uuid;

    #[test]
    fn test_sha256_postgis_hash_is_66_chars_and_deterministic() {
        let req = CreateBatchRequest {
            batch_code: "#KOP-LBG-2026-0891".to_string(),
            dds_reference: "EU-DDS-2026-ID-09941".to_string(),
            commodity_type: "KOPI_ROBUSTA".to_string(),
            exporter_name: "PT Sumatera Agri Makmur Sejahtera".to_string(),
            exporter_nib: "NIB 9120004928172".to_string(),
            origin_district: "Ulubelu, Tanggamus".to_string(),
            weight_kg: 24500.0,
            latitude: -5.321,
            longitude: 104.598,
            polygon_lat_lng: Some(vec![
                [-5.318, 104.594],
                [-5.319, 104.603],
                [-5.325, 104.605],
                [-5.318, 104.594],
            ]),
            eudr_compliant: true,
        };

        assert!(req.validate().is_ok());
        let h1 = req.compute_postgis_state_hash();
        let h2 = req.compute_postgis_state_hash();
        assert_eq!(h1, h2);
        assert!(h1.starts_with("0x"));
        assert_eq!(h1.len(), 66);
    }

    #[test]
    fn test_telemetry_validation_and_excursion_detection() {
        let payload = TelemetryPayload {
            trip_id: Uuid::new_v4(),
            latitude: -5.4496,
            longitude: 105.3129,
            speed_kmh: 48.0,
            temperature_c: 24.2,
            humidity_pct: 78.1,
            timestamp: Utc::now(),
        };

        let state = payload.validate().expect("Harus valid di koridor Lampung");
        assert_eq!(state, ReeferState::Excursion);
    }
}

