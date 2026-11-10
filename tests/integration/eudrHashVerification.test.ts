import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mockBatches } from '@/mocks/batches';

// Function calculating SHA-256 cryptographic digest of batch payload
export function calculatePostGisHash(payload: Record<string, unknown>): string {
  const jsonString = JSON.stringify(payload, Object.keys(payload).sort());
  const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
  return `0x${hash}`;
}

// Function generating GeoJSON FeatureCollection
export function generateEudrGeoJson(batchId: string, coordinates: [number, number][]) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates.map(([lat, lng]) => [lng, lat])], // GeoJSON is [lng, lat]
        },
        properties: {
          batchId,
          eudrRegulation: 'EU 2023/1115',
          deforestationCutOff: '2020-12-31',
          complianceStatus: 'VERIFIED_ZERO_DEFORESTATION',
        },
      },
    ],
  };
}

describe('Integration Test: EUDR Cryptographic State Hash & GeoJSON Verification', () => {
  const sampleBatch = mockBatches['#KOP-LBG-2026-0891'];

  it('TC-EUDR-01: SHA-256 generator menghasilkan hash 0x prefix dengan 64 karakter heksadesimal deterministik', () => {
    const payload = {
      batchId: sampleBatch.id,
      exporter: sampleBatch.exporterName,
      weightKg: sampleBatch.weightKg,
      coordinates: sampleBatch.centroidCoordinates,
    };

    const hash1 = calculatePostGisHash(payload);
    const hash2 = calculatePostGisHash(payload);

    assert.equal(hash1, hash2, 'Hash harus deterministik');
    assert.ok(hash1.startsWith('0x'));
    assert.equal(hash1.length, 66);
  });

  it('TC-EUDR-02: perubahan data sekecil apa pun pada payload harus mengubah total nilai hash (avalanche effect)', () => {
    const payloadOriginal = {
      batchId: sampleBatch.id,
      weightKg: 24500,
    };
    const payloadTampered = {
      batchId: sampleBatch.id,
      weightKg: 24501, // 1 kg difference
    };

    const hashOriginal = calculatePostGisHash(payloadOriginal);
    const hashTampered = calculatePostGisHash(payloadTampered);

    assert.notEqual(hashOriginal, hashTampered);
  });

  it('TC-EUDR-03: GeoJSON generator menghasilkan struktur FeatureCollection valid dengan koordinat [lng, lat] terbalik dari [lat, lng]', () => {
    const coords: [number, number][] = [
      [-5.318, 104.594],
      [-5.319, 104.603],
      [-5.325, 104.605],
      [-5.318, 104.594],
    ];

    const geoJson = generateEudrGeoJson(sampleBatch.id, coords);

    assert.equal(geoJson.type, 'FeatureCollection');
    assert.equal(geoJson.features[0].type, 'Feature');
    assert.equal(geoJson.features[0].geometry.type, 'Polygon');

    // In GeoJSON, first coordinate is Longitude, second is Latitude
    const firstCoord = geoJson.features[0].geometry.coordinates[0][0];
    assert.equal(firstCoord[0], 104.594); // Lng
    assert.equal(firstCoord[1], -5.318);  // Lat
  });
});

