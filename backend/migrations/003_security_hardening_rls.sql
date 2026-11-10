-- ============================================================================
-- MIGRATION 003: SECURITY HARDENING, LEAST-PRIVILEGE ROLES, RLS & AUDIT TRAIL
-- Project : Lampung Commodity Hub - Agri-Export GIS Tracker
-- Author  : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
-- ============================================================================

-- 1. Tabel Immutable Security Audit Log (Pencatatan Autentikasi & Aksi Kritis)
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL
        CHECK (actor_role IN (
            'CITY_COMMAND_ADMIN',
            'PELINDO_GATE_OFFICER',
            'BARANTIN_QUARANTINE_INSPECTOR',
            'REGISTERED_EXPORTER',
            'DRIVER_CABIN_HUD'
        )),
    action_type VARCHAR(64) NOT NULL,
    target_resource VARCHAR(64) NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    audit_digest_sha256 VARCHAR(66) NOT NULL
        CHECK (audit_digest_sha256 ~ '^0x[a-fA-F0-9]{64}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_audit_actor_time
    ON security_audit_logs (actor_id, created_at DESC);

-- 2. Proteksi Integritas Audit Log: Larang UPDATE dan DELETE pada security_audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Policy Violation: Tabel security_audit_logs bersifat append-only (immutable)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_security_audit ON security_audit_logs;
CREATE TRIGGER trg_immutable_security_audit
BEFORE UPDATE OR DELETE ON security_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- 3. Aktifkan Row-Level Security (RLS) pada Tabel Sensitif
ALTER TABLE commodity_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_inspections ENABLE ROW LEVEL SECURITY;

-- Kebijakan Baca Publik untuk Portal Traceability EUDR (Hanya SELECT)
DROP POLICY IF EXISTS policy_eudr_public_read ON commodity_batches;
CREATE POLICY policy_eudr_public_read
    ON commodity_batches
    FOR SELECT
    USING (TRUE);

-- Kebijakan Tulis Batch: Hanya Eksportir Terdaftar atau Admin Command Center
DROP POLICY IF EXISTS policy_batch_exporter_insert ON commodity_batches;
CREATE POLICY policy_batch_exporter_insert
    ON commodity_batches
    FOR INSERT
    WITH CHECK (
        current_setting('app.current_user_role', TRUE) IN ('REGISTERED_EXPORTER', 'CITY_COMMAND_ADMIN')
    );

-- Kebijakan Inspeksi Gerbang: Hanya Petugas Pelindo, Karantina Barantin, atau Admin
DROP POLICY IF EXISTS policy_gate_officer_insert ON gate_inspections;
CREATE POLICY policy_gate_officer_insert
    ON gate_inspections
    FOR INSERT
    WITH CHECK (
        current_setting('app.current_user_role', TRUE) IN (
            'PELINDO_GATE_OFFICER',
            'BARANTIN_QUARANTINE_INSPECTOR',
            'CITY_COMMAND_ADMIN'
        )
    );

