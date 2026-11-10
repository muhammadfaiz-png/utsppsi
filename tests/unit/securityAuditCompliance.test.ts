import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  sanitizeSearchQuery,
  isValidBatchCode,
  isValidLampungPlate,
  constantTimeEqual,
} from '@/utils/security';

describe('Security Audit Test: Input Validation, RBAC Auth, SQL Injection Prevention & RLS', () => {
  const projectRoot = process.cwd();
  const dbRsPath = path.join(projectRoot, 'backend/src/db.rs');
  const handlersRsPath = path.join(projectRoot, 'backend/src/handlers.rs');
  const securityRsPath = path.join(projectRoot, 'backend/src/security.rs');
  const rlsSqlPath = path.join(
    projectRoot,
    'backend/migrations/003_security_hardening_rls.sql'
  );

  it('TC-SEC-01: Pencegahan SQL Injection — seluruh query database di db.rs wajib menggunakan Parameterized Queries ($1, $2) dengan .bind() tanpa interpolasi format! di dalam SQL', () => {
    const dbRs = fs.readFileSync(dbRsPath, 'utf-8');

    assert.ok(
      dbRs.includes('$1') && dbRs.includes('.bind('),
      'db.rs wajib menggunakan positional bind parameters ($1, $2, ...) dan .bind()'
    );
    assert.ok(
      !dbRs.includes('sqlx::query(&format!(') && !dbRs.includes('sqlx::query(format!('),
      'db.rs dilarang menyusun query SQL menggunakan format! string interpolation'
    );
  });

  it('TC-SEC-02: Validasi Input & Sanitasi Batas Domain — modul security.rs & utils/security.ts wajib memfilter karakter injeksi berbahaya dan memvalidasi NIP 18 digit', () => {
    const securityRs = fs.readFileSync(securityRsPath, 'utf-8');

    assert.ok(
      securityRs.includes('pub fn validate_safe_text_input'),
      'security.rs harus menyediakan fungsi sanitasi teks validate_safe_text_input'
    );
    assert.ok(
      securityRs.includes('pub fn validate_officer_nip'),
      'security.rs harus memvalidasi format NIP 18 digit numerik petugas'
    );

    // Uji runtime fungsi sanitasi frontend src/utils/security.ts
    const cleanInput = sanitizeSearchQuery('#KOP-LBG-2026-0891');
    assert.equal(cleanInput.sanitized, '#KOP-LBG-2026-0891');
    assert.equal(cleanInput.wasModified, false);

    const untrustedInput = sanitizeSearchQuery("BE 8920 YU'; -- <script>");
    assert.ok(!untrustedInput.sanitized.includes(';'));
    assert.ok(!untrustedInput.sanitized.includes('--'));
    assert.ok(!untrustedInput.sanitized.includes('<script'));
    assert.equal(untrustedInput.wasModified, true);

    assert.equal(isValidBatchCode('#KOP-LBG-2026-0891'), true);
    assert.equal(isValidLampungPlate('BE 8920 YU'), true);
  });

  it('TC-SEC-03: Autentikasi Kriptografi, Bearer Header Verification & RBAC — modul security.rs & handlers.rs wajib memverifikasi klaim dan menggunakan constant-time comparison', () => {
    const securityRs = fs.readFileSync(securityRsPath, 'utf-8');
    const handlersRs = fs.readFileSync(handlersRsPath, 'utf-8');

    assert.ok(
      securityRs.includes('pub fn authorize_gate_decision'),
      'security.rs harus membatasi eksekusi gerbang hanya untuk peran resmi (Pelindo/Barantin/Admin)'
    );
    assert.ok(
      securityRs.includes('pub fn constant_time_eq'),
      'security.rs harus menggunakan perbandingan waktu-konstan untuk mencegah timing side-channel'
    );
    assert.ok(
      handlersRs.includes('pub fn extract_verified_claims'),
      'handlers.rs harus memverifikasi header Authorization Bearer sebelum mengeksekusi mutasi data'
    );

    assert.equal(
      constantTimeEqual(
        '0x9f41b2e8a719c8d35041a774b93198cf4201089ad18b7625cc1149e089a0fbc2',
        '0x9f41b2e8a719c8d35041a774b93198cf4201089ad18b7625cc1149e089a0fbc2'
      ),
      true
    );
    assert.equal(
      constantTimeEqual(
        '0x9f41b2e8a719c8d35041a774b93198cf4201089ad18b7625cc1149e089a0fbc2',
        '0x0000b2e8a719c8d35041a774b93198cf4201089ad18b7625cc1149e089a0fbc2'
      ),
      false
    );
  });

  it('TC-SEC-04: Database Hardening (RLS Context Activation, Immutable Audit Trail) serta Error Masking di handlers.rs', () => {
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
    const dbRs = fs.readFileSync(dbRsPath, 'utf-8');
    const handlersRs = fs.readFileSync(handlersRsPath, 'utf-8');

    assert.ok(
      rlsSql.includes('ENABLE ROW LEVEL SECURITY'),
      'Migrasi keamanan wajib mengaktifkan Row-Level Security (RLS) pada tabel sensitif'
    );
    assert.ok(
      dbRs.includes("SELECT set_config('app.current_user_role', $1, TRUE)"),
      'db.rs wajib mengaktifkan konteks peran RLS di dalam transaksi database'
    );
    assert.ok(
      dbRs.includes('INSERT INTO security_audit_logs'),
      'db.rs wajib mencatat setiap aksi kritis ke tabel append-only security_audit_logs'
    );
    assert.ok(
      rlsSql.includes('CREATE TRIGGER trg_immutable_security_audit'),
      'Tabel security_audit_logs wajib dilindungi trigger append-only (immutable)'
    );
    assert.ok(
      !handlersRs.includes('format!("Database error: {err}")'),
      'handlers.rs tidak boleh membocorkan pesan error internal SQL ke respons HTTP klien'
    );
  });
});
