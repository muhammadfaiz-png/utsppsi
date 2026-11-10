// ============================================================================
// MODULE  : models.rs (Hardened Domain DTOs, Input Validation & Crypto Helpers)
// Project : Lampung Commodity Hub - Agri-Export GIS Tracker
// Author  : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
// ============================================================================

use crate::security::{validate_officer_nip, validate_safe_text_input, SecurityError};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use thiserror::Error;
use uuid::Uuid;

/// Ambang batas operasional koridor Lampung (SKILL.md Bab 10)
pub const LAMPUNG_LAT_MIN: f64 = -6.0;
pub const LAMPUNG_LAT_MAX: f64 = -4.5;
pub const LAMPUNG_LNG_MIN: f64 = 103.5;
pub const LAMPUNG_LNG_MAX: f64 = 106.0;
pub const REEFER_MAX_TEMP_C: f32 = 22.0;
pub const REEFER_WARN_TEMP_C: f32 = 20.0;
pub const MAX_WEIGHT_VARIANCE_PCT: f64 = 1.5;
pub const MIN_ALPR_OCR_CONFIDENCE: f64 = 95.0;

#[derive(Debug, Error, PartialEq)]
pub enum DomainValidationError {
    #[error("Koordinat GPS ({lat}, {lng}) berada di luar koridor Provinsi Lampung")]
    OutOfCorridorBounds { lat: f64, lng: f64 },

    #[error("Berat komoditas ({0} kg) harus lebih besar dari 0 kg dan maksimal 60,000 kg")]
    InvalidWeight(f64),

    #[error("Kelembapan sensor ({0}%) harus berada pada rentang 0.0% - 100.0%")]
    InvalidHumidity(f32),

    #[error("Suhu sensor ({0}°C) berada di luar batas fisik sensor (-30.0°C s/d 60.0°C)")]
    InvalidSensorTemperature(f32),

    #[error("Poligon EUDR harus memiliki minimal 4 titik koordinat tertutup (titik awal == titik akhir)")]
    InvalidPolygonRing,

    #[error("Pelanggaran keamanan input: {0}")]
    SecurityViolation(#[from] SecurityError),
}

/// Status termal kontainer berpendingin (reefer)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ReeferState {
    Optimal,
    Warning,
    Excursion,
}

impl ReeferState {
    pub fn from_temperature(temp_c: f32) -> Self {
        if temp_c > REEFER_MAX_TEMP_C {
            Self::Excursion
        } else if temp_c > REEFER_WARN_TEMP_C {
            Self::Warning
        } else {
            Self::Optimal
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Optimal => "OPTIMAL",
            Self::Warning => "WARNING",
            Self::Excursion => "EXCURSION",
        }
    }
}

/// Payload DTO untuk ingesti telemetri sensor IoT cold-chain (Hardened)
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
    pub fn validate(&self) -> Result<ReeferState, DomainValidationError> {
        if !(LAMPUNG_LAT_MIN..=LAMPUNG_LAT_MAX).contains(&self.latitude)
            || !(LAMPUNG_LNG_MIN..=LAMPUNG_LNG_MAX).contains(&self.longitude)
        {
            return Err(DomainValidationError::OutOfCorridorBounds {
                lat: self.latitude,
                lng: self.longitude,
            });
        }

        if !(-30.0..=60.0).contains(&self.temperature_c) {
            return Err(DomainValidationError::InvalidSensorTemperature(
                self.temperature_c,
            ));
        }

        if !(0.0..=100.0).contains(&self.humidity_pct) {
            return Err(DomainValidationError::InvalidHumidity(self.humidity_pct));
        }

        Ok(ReeferState::from_temperature(self.temperature_c))
    }
}

/// DTO untuk pembuatan batch komoditas baru (EUDR compliance - Hardened SEC-01 & SEC-04)
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
    /// Koordinat input dalam urutan domain [latitude, longitude]
    pub polygon_lat_lng: Option<Vec<[f64; 2]>>,
    pub eudr_compliant: bool,
}

impl CreateBatchRequest {
    /// Validasi input berlapis: sanitasi anti-injeksi + batas geografis + penutupan poligon
    pub fn validate(&self) -> Result<(), DomainValidationError> {
        // 1. Sanitasi seluruh field string terhadap injeksi SQL/XSS/karakter kontrol (SEC-01)
        validate_safe_text_input("batch_code", &self.batch_code, 32)?;
        validate_safe_text_input("dds_reference", &self.dds_reference, 32)?;
        validate_safe_text_input("commodity_type", &self.commodity_type, 32)?;
        validate_safe_text_input("exporter_name", &self.exporter_name, 128)?;
        validate_safe_text_input("exporter_nib", &self.exporter_nib, 32)?;
        validate_safe_text_input("origin_district", &self.origin_district, 128)?;

        // 2. Validasi batas fisik tonase muatan (0 < weight_kg <= 60,000 kg)
        if self.weight_kg <= 0.0 || self.weight_kg > 60_000.0 || !self.weight_kg.is_finite() {
            return Err(DomainValidationError::InvalidWeight(self.weight_kg));
        }

        // 3. Validasi batas geografis koridor Lampung
        if !(LAMPUNG_LAT_MIN..=LAMPUNG_LAT_MAX).contains(&self.latitude)
            || !(LAMPUNG_LNG_MIN..=LAMPUNG_LNG_MAX).contains(&self.longitude)
        {
            return Err(DomainValidationError::OutOfCorridorBounds {
                lat: self.latitude,
                lng: self.longitude,
            });
        }

        // 4. Validasi cincin poligon EUDR (minimal 4 titik dan tertutup: titik awal == titik akhir)
        if let Some(ref ring) = self.polygon_lat_lng {
            if ring.len() < 4 {
                return Err(DomainValidationError::InvalidPolygonRing);
            }
            let first = ring[0];
            let last = ring[ring.len() - 1];
            if (first[0] - last[0]).abs() > 1e-6 || (first[1] - last[1]).abs() > 1e-6 {
                return Err(DomainValidationError::InvalidPolygonRing);
            }
        }

        Ok(())
    }

    /// Menghasilkan SHA-256 PostGIS Cryptographic State Hash deterministik ('0x' + 64 hex)
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
        let digest = Sha256::digest(canonical.as_bytes());
        format!("0x{}", hex::encode(digest))
    }

    /// Konversi koordinat domain [lat, lng] menjadi standar RFC 7946 GeoJSON [lng, lat]
    pub fn to_geojson_polygon_string(&self) -> Option<String> {
        self.polygon_lat_lng.as_ref().map(|coords| {
            let geojson_coords: Vec<[f64; 2]> =
                coords.iter().map(|&[lat, lng]| [lng, lat]).collect();
            serde_json::json!({
                "type": "Polygon",
                "coordinates": [geojson_coords]
            })
            .to_string()
        })
    }
}

/// DTO Keputusan Inspeksi Gerbang Pelabuhan (3-Way Decision Matrix - SKILL.md 6.6)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum GateDecision {
    Approve,
    Divert,
    Reject,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GateInspectionRequest {
    pub trip_id: Uuid,
    pub queue_number: i32,
    pub time_slot: String,
    pub alpr_matched: bool,
    pub ocr_confidence_pct: f64,
    pub qr_token_valid: bool,
    pub e_seal_integrity: String, // "SECURE" | "TAMPERED"
    pub weighbridge_gross_kg: f64,
    pub weighbridge_net_kg: f64,
    pub weight_variance_pct: f64,
    pub requested_decision: GateDecision,
    pub officer_nip: String,
}

impl GateInspectionRequest {
    /// Validasi keamanan payload inspeksi gerbang (SEC-01 & SEC-02)
    pub fn validate(&self) -> Result<(), DomainValidationError> {
        validate_officer_nip(&self.officer_nip)?;
        validate_safe_text_input("time_slot", &self.time_slot, 32)?;
        validate_safe_text_input("e_seal_integrity", &self.e_seal_integrity, 16)?;

        if self.weighbridge_gross_kg <= 0.0 || self.weighbridge_net_kg <= 0.0 {
            return Err(DomainValidationError::InvalidWeight(
                self.weighbridge_net_kg,
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GateDecisionOutcome {
    pub approved: bool,
    pub final_decision: GateDecision,
    pub lane_action: String,
    pub message: String,
}

/// Evaluasi matriks keputusan gerbang sesuai TC-GATE-01 s/d TC-GATE-05 & SEC-03
pub fn evaluate_gate_decision(req: &GateInspectionRequest) -> GateDecisionOutcome {
    match req.requested_decision {
        GateDecision::Approve => {
            if !req.alpr_matched || req.ocr_confidence_pct < MIN_ALPR_OCR_CONFIDENCE {
                return GateDecisionOutcome {
                    approved: false,
                    final_decision: GateDecision::Divert,
                    lane_action: "HOLD_ALPR_VERIFICATION".to_string(),
                    message: "Gagal: OCR ALPR di bawah ambang 95.0% atau plat tidak cocok".to_string(),
                };
            }
            if !req.qr_token_valid {
                return GateDecisionOutcome {
                    approved: false,
                    final_decision: GateDecision::Divert,
                    lane_action: "HOLD_INVALID_QR".to_string(),
                    message: "Gagal: QR Token Ed25519 kabin tidak valid".to_string(),
                };
            }
            if req.e_seal_integrity == "TAMPERED" {
                return GateDecisionOutcome {
                    approved: false,
                    final_decision: GateDecision::Reject,
                    lane_action: "LOCKDOWN".to_string(),
                    message: "Gagal Kritis: E-Seal RFID rusak/tampered, gerbang dikunci".to_string(),
                };
            }
            if req.weight_variance_pct > MAX_WEIGHT_VARIANCE_PCT {
                return GateDecisionOutcome {
                    approved: false,
                    final_decision: GateDecision::Divert,
                    lane_action: "DIVERT_WEIGHT".to_string(),
                    message: "Gagal: Variansi jembatan timbang melebihi batas toleransi 1.5%".to_string(),
                };
            }

            GateDecisionOutcome {
                approved: true,
                final_decision: GateDecision::Approve,
                lane_action: "BARRIER_OPEN".to_string(),
                message: "Approve Sukses: Palang hidrolik dibuka selama 45 detik".to_string(),
            }
        }
        GateDecision::Divert => GateDecisionOutcome {
            approved: true,
            final_decision: GateDecision::Divert,
            lane_action: "DIVERT_BUFFER".to_string(),
            message: "Armada dialihkan ke Buffer Zone Holding KM 42".to_string(),
        },
        GateDecision::Reject => GateDecisionOutcome {
            approved: true,
            final_decision: GateDecision::Reject,
            lane_action: "GATE_REJECT_TURNAROUND".to_string(),
            message: "Akses masuk ditolak dan manifest ekspor dibekukan sementara".to_string(),
        },
    }
}
