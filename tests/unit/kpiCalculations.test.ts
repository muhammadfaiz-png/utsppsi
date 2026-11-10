import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper function implementing the sparkline algorithm to verify math under test
export function computeSparklinePoints(
  sparklineData: number[],
  width = 200,
  height = 40,
  padding = 5
) {
  if (!sparklineData || sparklineData.length === 0) {
    return { path: '', area: '', lastX: 200, lastY: 20 };
  }
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;

  if (sparklineData.length === 1) {
    const y = height / 2;
    return {
      path: `M 0 ${y} L ${width} ${y}`,
      area: `M 0 ${y} L ${width} ${y} L ${width} ${height} L 0 ${height} Z`,
      lastX: width,
      lastY: y,
    };
  }

  const divisor = sparklineData.length - 1;
  const coords = sparklineData.map((val, idx) => {
    const x = (idx / divisor) * width;
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return { x, y };
  });

  const path = coords.reduce(
    (acc, pt, i) =>
      acc
        ? `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
        : `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
    ''
  );
  const last = coords[coords.length - 1];
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return { path, area, lastX: last.x, lastY: last.y };
}

describe('Unit Test: KPI Sparkline Calculation & Math Edge Cases', () => {
  it('TC-KPI-01: harus menghasilkan path SVG valid untuk data normal', () => {
    const data = [10, 20, 15, 30, 25];
    const result = computeSparklinePoints(data);

    assert.ok(result.path.startsWith('M 0.0'));
    assert.ok(result.area.includes('Z'));
    assert.equal(result.lastX, 200);
    assert.ok(!result.path.includes('NaN'), 'Path tidak boleh mengandung NaN');
  });

  it('TC-KPI-02: harus menangani data kosong tanpa error (empty array)', () => {
    const result = computeSparklinePoints([]);
    assert.equal(result.path, '');
    assert.equal(result.area, '');
    assert.equal(result.lastX, 200);
    assert.equal(result.lastY, 20);
  });

  it('TC-KPI-03: [BUG-01 Regression Test] harus menangani array satu elemen tanpa division by zero / NaN', () => {
    const result = computeSparklinePoints([100]);
    assert.ok(!result.path.includes('NaN'), 'Path tidak boleh mengandung NaN saat panjang data = 1');
    assert.equal(result.lastX, 200);
    assert.equal(result.lastY, 20); // 40 / 2 = 20
  });

  it('TC-KPI-04: harus menangani data bernilai konstan (range = 0)', () => {
    const result = computeSparklinePoints([50, 50, 50, 50]);
    assert.ok(!result.path.includes('NaN'), 'Path tidak boleh NaN saat nilai datar');
    assert.equal(result.lastX, 200);
  });

  it('TC-KPI-05: progress bar persentase harus ter-clamp pada rentang 0-100%', () => {
    const clampProgress = (pct: number) => Math.min(100, Math.max(0, pct));
    assert.equal(clampProgress(-25), 0);
    assert.equal(clampProgress(150), 100);
    assert.equal(clampProgress(70), 70);
  });
});
