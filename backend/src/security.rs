// ============================================================================
// MODULE  : security.rs (Input Sanitization, RBAC Auth, & Crypto Verification)
// Project : Lampung Commodity Hub - Agri-Export GIS Tracker
// Author  : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
// ============================================================================

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use thiserror::Error;

#[derive(Debug, Error, PartialEq)]
pub enum SecurityError {
    #[error("Autentikasi gagal: Header Authorization Bearer tidak ditemukan atau format salah")]
    MissingOrMalformedToken,

    #[error("Autentikasi gagal: Token sesi kedaluwarsa atau tanda tangan kriptografi tidak valid")]
    InvalidTokenSignature,

    #[error("Akses ditolak (RBAC): Peran '{role}' tidak memiliki izin untuk aksi '{action}'")]
    InsufficientRolePermission { role: String, action: String },

    #[error("Validasi keamanan gagal: Input '{field}' mengandung karakter terlarang atau pola berbahaya")]
    UntrustedInputRejected { field: String },

    #[error("Format identitas petugas (NIP '{0}') tidak valid (wajib 18 digit numerik)")]
    InvalidOfficerNip(String),
}

/// Peran pengguna dalam arsitektur Role-Based Access Control (RBAC)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SystemRole {
    CityCommandAdmin,
    PelindoGateOfficer,
    BarantinQuarantineInspector,
    RegisteredExporter,
    DriverCabinHud,
}

impl SystemRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::CityCommandAdmin => "CITY_COMMAND_ADMIN",
            Self::PelindoGateOfficer => "PELINDO_GATE_OFFICER",
            Self::BarantinQuarantineInspector => "BARANTIN_QUARANTINE_INSPECTOR",
            Self::RegisteredExporter => "REGISTERED_EXPORTER",
            Self::DriverCabinHud => "DRIVER_CABIN_HUD",
        }
    }
}

/// Klaim autentikasi terverifikasi (JWT / Ed25519 Session Claims)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthClaims {
    pub sub: String,
    pub nip: Option<String>,
    pub role: SystemRole,
    pub exp: i64,
}

/// Memeriksa apakah teks mengandung karakter kontrol atau pola injeksi berbahaya
/// (Defense-in-Depth melengkapi Parameterized Queries SQLx)
pub fn validate_safe_text_input(field_name: &str, value: &str, max_len: usize) -> Result<(), SecurityError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > max_len {
        return Err(SecurityError::UntrustedInputRejected {
            field: field_name.to_string(),
        });
    }

    // Tolak karakter kontrol ASCII dan pola injeksi umum (HTML/Script/SQL comment)
    let forbidden_patterns = ["<script", "</script", "javascript:", "--", "/*", "*/", ";", "\0"];
    let lower = trimmed.to_lowercase();
    for pat in forbidden_patterns {
        if lower.contains(pat) {
            return Err(SecurityError::UntrustedInputRejected {
                field: field_name.to_string(),
            });
        }
    }

    if trimmed.chars().any(|c| c.is_control()) {
        return Err(SecurityError::UntrustedInputRejected {
            field: field_name.to_string(),
        });
    }

    Ok(())
}

/// Validasi format NIP 18 digit ASN / Petugas Barantin & Pelindo
pub fn validate_officer_nip(nip: &str) -> Result<(), SecurityError> {
    if nip.len() != 18 || !nip.chars().all(|c| c.is_ascii_digit()) {
        return Err(SecurityError::InvalidOfficerNip(nip.to_string()));
    }
    Ok(())
}

/// Otorisasi berbasis peran (RBAC) untuk eksekusi keputusan gerbang pelabuhan
pub fn authorize_gate_decision(claims: &AuthClaims) -> Result<(), SecurityError> {
    match claims.role {
        SystemRole::PelindoGateOfficer
        | SystemRole::BarantinQuarantineInspector
        | SystemRole::CityCommandAdmin => Ok(()),
        other => Err(SecurityError::InsufficientRolePermission {
            role: other.as_str().to_string(),
            action: "EXECUTE_PORT_GATE_DECISION".to_string(),
        }),
    }
}

/// Perbandingan byte waktu-konstan (Constant-Time Comparison) untuk mencegah Timing Attack
pub fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff: u8 = 0;
    for (&x, &y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

/// Verifikasi integritas hash SHA-256 paspor komoditas dengan perbandingan waktu-konstan
pub fn verify_batch_state_hash(expected_hash: &str, computed_hash: &str) -> bool {
    constant_time_eq(expected_hash.as_bytes(), computed_hash.as_bytes())
}

/// Pembuatan digest audit trail yang tidak dapat diubah (Immutable Security Audit Digest)
pub fn compute_security_audit_digest(actor_id: &str, action: &str, target_id: &str, timestamp_iso: &str) -> String {
    let payload = format!("actor={actor_id}|action={action}|target={target_id}|ts={timestamp_iso}");
    let digest = Sha256::digest(payload.as_bytes());
    format!("0x{}", hex::encode(digest))
}

