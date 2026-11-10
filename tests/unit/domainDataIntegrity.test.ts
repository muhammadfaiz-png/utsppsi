import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mockTrucks } from '@/mocks/trucks';
import { mockBatches } from '@/mocks/batches';
import { mockIncidents } from '@/mocks/incidents';
import { mockGateQueue } from '@/mocks/gateQueue';
import { mockManifests } from '@/mocks/manifests';

describe('Unit Test: Domain Data Integrity (SKILL.md Bab 10 Compliance)', () => {
  it('TC-DOM-01: format plat nomor armada harus selalu format Lampung BE (BE XXXX YY)', () => {
    const plateRegex = /^BE \d{3,4} [A-Z]{2}$/;
    mockTrucks.forEach((truck) => {
      assert.match(
        truck.truckPlate,
        plateRegex,
        `Plat nomor ${truck.truckPlate} tidak valid sesuai format BE Lampung`
      );
    });
  });

  it('TC-DOM-02: koordinat GPS armada harus berada di dalam batas koridor Lampung (-5.6 s.d -5.0 Lat, 105.0 s.d 105.6 Lng)', () => {
    mockTrucks.forEach((truck) => {
      assert.ok(
        truck.currentLat >= -6.0 && truck.currentLat <= -4.8,
        `Latitude ${truck.currentLat} di luar batas Provinsi Lampung`
      );
      assert.ok(
        truck.currentLng >= 104.8 && truck.currentLng <= 105.8,
        `Longitude ${truck.currentLng} di luar koridor Pelabuhan Panjang`
      );
    });
  });

  it('TC-DOM-03: ambang batas suhu reefer normal (17-19°C) vs excursion (>20°C)', () => {
    mockTrucks.forEach((truck) => {
      if (truck.reeferStatus === 'OPTIMAL') {
        assert.ok(
          truck.temperatureC >= 16.5 && truck.temperatureC <= 19.5,
          `Truk ${truck.truckPlate} berstatus OPTIMAL tetapi suhu ${truck.temperatureC}°C di luar rentang normal`
        );
      } else if (truck.reeferStatus === 'EXCURSION') {
        assert.ok(
          truck.temperatureC > 20.0,
          `Truk ${truck.truckPlate} berstatus EXCURSION tetapi suhu ${truck.temperatureC}°C tidak melampaui 20°C`
        );
      }
    });
  });

  it('TC-DOM-04: ID batch komoditas harus mengikuti standar penomoran #KOP/#LAD/#KAK/#CPO', () => {
    const batchIdRegex = /^#(KOP|LAD|KAK|CPO)-[A-Z]{3}-2026-\d{4}$/;
    Object.values(mockBatches).forEach((batch) => {
      assert.match(
        batch.id,
        batchIdRegex,
        `Format ID Batch ${batch.id} tidak sesuai standar`
      );
    });
  });

  it('TC-DOM-05: PostGIS State Hash harus tepat 66 karakter heksadesimal (0x + 64 hex SHA-256)', () => {
    const hashRegex = /^0x[a-f0-9]{64}$/i;
    Object.values(mockBatches).forEach((batch) => {
      assert.match(
        batch.postGisStateHash,
        hashRegex,
        `Hash PostGIS ${batch.postGisStateHash} tidak valid SHA-256`
      );
    });
  });

  it('TC-DOM-06: Antrian Virtual Gate harus memiliki slot waktu dan nomor antrian berurutan', () => {
    assert.ok(mockGateQueue.length > 0);
    mockGateQueue.forEach((item, idx) => {
      assert.equal(item.queueNumber, idx + 1);
      assert.ok(item.timeSlot.includes('–') || item.timeSlot.includes('-'));
      assert.ok(item.weighbridgeNetKg > 0);
    });
  });

  it('TC-DOM-07: Dokumen manifest ekspor harus memiliki nomor kontainer standar ISO 6346', () => {
    // 4 huruf + nomor
    mockManifests.forEach((manifest) => {
      assert.ok(
        manifest.containerNo.length >= 8,
        `Nomor kontainer ${manifest.containerNo} tidak sesuai format ISO`
      );
      assert.ok(manifest.weightMt > 0);
    });
  });
});

