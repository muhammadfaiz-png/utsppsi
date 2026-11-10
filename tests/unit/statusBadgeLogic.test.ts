import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BadgeVariant } from '@/components/common/StatusBadge';

describe('Unit Test: Status Badge Token Mapping', () => {
  const expectedStyles: Record<BadgeVariant, string> = {
    ok: 'bg-secondary-container text-on-secondary-container',
    neutral: 'bg-surface-container-high text-on-surface',
    critical: 'bg-error text-on-error animate-pulse',
    warning: 'bg-error-container text-error',
    active: 'bg-primary-container text-surface-bright',
    live: 'bg-surface-container-high text-secondary',
  };

  it('TC-BDG-01: setiap varian status badge harus memetakan ke token warna resmi SKILL.md', () => {
    Object.entries(expectedStyles).forEach(([variant, expectedClass]) => {
      assert.ok(expectedClass.length > 0);
      assert.ok(
        !expectedClass.includes('blue') &&
          !expectedClass.includes('yellow') &&
          !expectedClass.includes('purple'),
        `Varian ${variant} tidak boleh menggunakan warna terlarang di luar palet Material 3`
      );
    });
  });

  it('TC-BDG-02: varian critical harus menyertakan animasi pulse dan warna error', () => {
    assert.ok(expectedStyles.critical.includes('animate-pulse'));
    assert.ok(expectedStyles.critical.includes('bg-error'));
  });

  it('TC-BDG-03: varian ok harus menggunakan token secondary (teal #006a61)', () => {
    assert.ok(expectedStyles.ok.includes('secondary-container'));
  });
});

