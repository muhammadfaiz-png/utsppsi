import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GateInspectionItem, GateDecision } from '@/types';

export function evaluateGateDecision(
  item: GateInspectionItem,
  decision: GateDecision,
  officerRole: string
): { success: boolean; message: string; laneAction: string } {
  if (decision === 'APPROVE') {
    if (!item.alprMatch || item.ocrConfidence < 95.0) {
      return {
        success: false,
        message: 'Gagal: OCR ALPR Plat nomor di bawah standar toleransi 95%',
        laneAction: 'HOLD',
      };
    }
    if (!item.qrTokenValid) {
      return {
        success: false,
        message: 'Gagal: QR Token kabin tidak valid atau telah kedaluwarsa',
        laneAction: 'HOLD',
      };
    }
    if (item.eSealIntegrity === 'TAMPERED') {
      return {
        success: false,
        message: 'Gagal: Segel elektronik (E-Seal RFID) terindikasi dibongkar paksa',
        laneAction: 'LOCKDOWN',
      };
    }
    if (item.weightVariancePct > 1.5) {
      return {
        success: false,
        message: 'Gagal: Diskrepansi timbangan melebihi toleransi Barantin (1.5%)',
        laneAction: 'DIVERT_WEIGHT',
      };
    }

    return {
      success: true,
      message: 'Approve Sukses: Palang hidrolik gerbang terbuka 45 detik',
      laneAction: 'BARRIER_OPEN',
    };
  }

  if (decision === 'DIVERT') {
    return {
      success: true,
      message: 'Divert Berhasil: Tiket oranye diterbitkan menuju Buffer Zone KM 42',
      laneAction: 'DIVERT_BUFFER',
    };
  }

  if (decision === 'REJECT') {
    return {
      success: true,
      message: 'Reject Dikonfirmasi: Izin masuk dibatalkan dan manifest ekspor dibekukan',
      laneAction: 'GATE_REJECT_TURNAROUND',
    };
  }

  return { success: false, message: 'Keputusan tidak dikenali', laneAction: 'HOLD' };
}

describe('Integration Test: Port Gate ALPR & Decision Matrix Inspection Workflow', () => {
  const cleanTruckItem: GateInspectionItem = {
    id: 'Q-01',
    truckPlate: 'BE 8920 YU',
    batchId: '#KOP-LBG-2026-0891',
    driverName: 'Bambang Supriyadi',
    driverPhone: '+62 812-7391-8821',
    commodity: 'Kopi Robusta Grade 1 (24,500 KG)',
    alprMatch: true,
    ocrConfidence: 99.4,
    qrTokenValid: true,
    eSealIntegrity: 'SECURE',
    weighbridgeGrossKg: 42350,
    weighbridgeNetKg: 24500,
    weightVariancePct: 0.12,
    assignedLane: 'Jalur 3 (Fast-Track)',
    status: 'IN_INSPECTION',
    timeSlot: '16:30 – 16:45',
    priorityStatus: 'Priority Transit',
    queueNumber: 1,
    temperatureHistory: [{ time: '16:00', temp: 18.2 }],
  };

  it('TC-GATE-01: truk dengan seluruh parameter valid dapat disetujui (APPROVE)', () => {
    const result = evaluateGateDecision(cleanTruckItem, 'APPROVE', 'PETUGAS_PELINDO');
    assert.equal(result.success, true);
    assert.equal(result.laneAction, 'BARRIER_OPEN');
  });

  it('TC-GATE-02: sistem menolak APPROVE jika segel elektronik (E-Seal) rusak/tampered', () => {
    const tamperedTruck = { ...cleanTruckItem, eSealIntegrity: 'TAMPERED' as const };
    const result = evaluateGateDecision(tamperedTruck, 'APPROVE', 'PETUGAS_PELINDO');
    assert.equal(result.success, false);
    assert.equal(result.laneAction, 'LOCKDOWN');
  });

  it('TC-GATE-03: sistem menolak APPROVE jika variansi berat jembatan timbang > 1.5%', () => {
    const overweightTruck = { ...cleanTruckItem, weightVariancePct: 2.45 };
    const result = evaluateGateDecision(overweightTruck, 'APPROVE', 'PETUGAS_PELINDO');
    assert.equal(result.success, false);
    assert.equal(result.laneAction, 'DIVERT_WEIGHT');
  });

  it('TC-GATE-04: keputusan DIVERT berhasil mengalihkan truk ke buffer holding', () => {
    const result = evaluateGateDecision(cleanTruckItem, 'DIVERT', 'PETUGAS_PELINDO');
    assert.equal(result.success, true);
    assert.equal(result.laneAction, 'DIVERT_BUFFER');
  });

  it('TC-GATE-05: keputusan REJECT membatalkan akses dan memicu putar arah truk', () => {
    const result = evaluateGateDecision(cleanTruckItem, 'REJECT', 'PETUGAS_PELINDO');
    assert.equal(result.success, true);
    assert.equal(result.laneAction, 'GATE_REJECT_TURNAROUND');
  });
});

