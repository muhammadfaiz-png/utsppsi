/**
 * Modul Hardening Keamanan Frontend & Validasi Input
 * Proyek : Lampung Commodity Hub - Agri-Export GIS Tracker
 * Author : Muhammad Faiz & Dr. Erliyan Redy Susanto, M.Kom (UTI)
 */

const FORBIDDEN_PATTERNS = [
  /<script/gi,
  /<\/script>/gi,
  /javascript:/gi,
  /--/g,
  /\/\*/g,
  /\*\//g,
  /;/g,
  /['"\\<>]/g,
];

/**
 * Sanitasi input pencarian atau teks bebas dari pola XSS & SQL Injection (SEC-01)
 */
export function sanitizeSearchQuery(rawInput: string, maxLength = 48): {
  sanitized: string;
  wasModified: boolean;
} {
  if (!rawInput) {
    return { sanitized: '', wasModified: false };
  }

  let cleaned = rawInput.replace(/[\x00-\x1F\x7F]/g, '');
  FORBIDDEN_PATTERNS.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '');
  });

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return {
    sanitized: cleaned,
    wasModified: cleaned !== rawInput,
  };
}

/**
 * Validasi format kode Batch Komoditas (#KOP-LBG-2026-0891)
 */
export function isValidBatchCode(code: string): boolean {
  return /^#?(KOP|LAD|KAK|CPO)-[A-Z]{3}-2026-\d{4}$/i.test(code.trim());
}

/**
 * Validasi format plat nomor armada Lampung (BE 8920 YU)
 */
export function isValidLampungPlate(plate: string): boolean {
  return /^BE \d{3,4} [A-Z]{2}$/i.test(plate.trim());
}

/**
 * Perbandingan string waktu-konstan (Constant-Time Comparison) untuk mencegah Timing Attack (SEC-04)
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

