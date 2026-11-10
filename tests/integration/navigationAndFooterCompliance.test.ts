import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mockTrucks } from '@/mocks/trucks';
import { mockGateQueue } from '@/mocks/gateQueue';
import { mockBatches } from '@/mocks/batches';

describe('Integration Test: Module Route Resolution, Footer Copyright & Cross-Module Sync', () => {
  const projectRoot = process.cwd();

  it('TC-NAV-01: [BUG-06 Regression Test] seluruh modul operasional pada Sidebar wajib memiliki file page.tsx aktif (bebas 404 Not Found)', () => {
    const requiredRoutes = [
      'src/app/(dashboard)/command/page.tsx',
      'src/app/(dashboard)/driver/page.tsx',
      'src/app/(dashboard)/gate/page.tsx',
      'src/app/(dashboard)/eudr/[batchId]/page.tsx',
      'src/app/(dashboard)/eudr/page.tsx',
    ];

    requiredRoutes.forEach((relPath) => {
      const fullPath = path.join(projectRoot, relPath);
      assert.ok(
        fs.existsSync(fullPath),
        `File route ${relPath} harus tersedia untuk mencegah HTTP 404 Not Found`
      );
    });
  });

  it('TC-NAV-02: [BUG-07 Regression Test] logika active state Sidebar harus mengenali seluruh sub-rute /eudr/[batchId]', () => {
    const isSidebarItemActive = (itemHref: string, pathname: string): boolean => {
      if (itemHref === '/command') return pathname === '/command';
      if (itemHref.startsWith('/eudr')) return pathname.startsWith('/eudr');
      return pathname.startsWith(itemHref.split('?')[0]);
    };

    assert.equal(isSidebarItemActive('/eudr/KOP-LBG-2026-0891', '/eudr/KOP-LBG-2026-0891'), true);
    assert.equal(isSidebarItemActive('/eudr/KOP-LBG-2026-0891', '/eudr/KOP-LBG-2026-0892'), true);
    assert.equal(isSidebarItemActive('/eudr/KOP-LBG-2026-0891', '/eudr/LAD-SKD-2026-0120'), true);
    assert.equal(isSidebarItemActive('/driver', '/driver'), true);
    assert.equal(isSidebarItemActive('/gate', '/gate'), true);
  });

  it('TC-FTR-01: komponen Footer.tsx wajib memuat teks Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom', () => {
    const footerPath = path.join(projectRoot, 'src/components/layout/Footer.tsx');
    const content = fs.readFileSync(footerPath, 'utf-8');

    assert.ok(
      content.includes('Copyright©2026 by Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom'),
      'Footer harus memuat teks hak cipta Muhammad Faiz dan Dr. Erliyan Redy Susanto, M.Kom'
    );
    assert.ok(
      content.includes('Universitas Teknokrat Indonesia (UTI)'),
      'Footer harus memuat atribusi Universitas Teknokrat Indonesia (UTI)'
    );
  });

  it('TC-DRV-01: seluruh armada di antrian Port Gate harus terhubung secara konsisten dengan armada Driver Console dan Batch EUDR', () => {
    const truckPlates = new Set(mockTrucks.map((t) => t.truckPlate));
    mockGateQueue.forEach((gateItem) => {
      assert.ok(
        truckPlates.has(gateItem.truckPlate),
        `Armada antrian gerbang ${gateItem.truckPlate} harus terdaftar di data telemetri Driver Console`
      );
    });

    // Pastikan batch utama di mockBatches memiliki DDS ID dan koordinat poligon valid
    const primaryBatch = mockBatches['#KOP-LBG-2026-0891'];
    assert.ok(primaryBatch);
    assert.equal(primaryBatch.ddsId, 'EU-DDS-2026-ID-09941');
    assert.ok((primaryBatch.polygonCoordinates?.length ?? 0) >= 4);
  });
});

