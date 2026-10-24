/**
 * GLEIS Cryptographic & Evidence Integrity Service
 * Calculates SHA-256 hashes to establish a tamper-evident chain of custody
 * compliant with Ghana Evidence Act (NRCD 323) requirements for electronic records.
 */

// Cross-environment crypto resolution (Browser window.crypto or Node.js globalThis.crypto)
function getSubtleCrypto(): SubtleCrypto {
  const c = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error('SubtleCrypto is not supported in this environment');
  }
  return c.subtle;
}

export async function calculateFileSha256(file: File | Blob): Promise<string> {
  try {
    const subtle = getSubtleCrypto();
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('SubtleCrypto error in calculateFileSha256:', e);
    throw e;
  }
}

/**
 * Calculates SHA-256 hash for arbitrary text (used for audit record verification)
 */
export async function calculateTextSha256(text: string): Promise<string> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates that an evidence file's binary contents match its recorded cryptographic hash.
 */
export async function verifyEvidenceIntegrity(file: File | Blob, expectedHash: string): Promise<{
  isValid: boolean;
  computedHash: string;
  expectedHash: string;
}> {
  const computed = await calculateFileSha256(file);
  return {
    isValid: computed.toLowerCase() === expectedHash.toLowerCase(),
    computedHash: computed,
    expectedHash: expectedHash,
  };
}

/**
 * Formats a SHA-256 hash for human legal verification display (e.g. "a3f5...891c")
 */
export function formatHashTruncated(hash: string, length = 10): string {
  if (!hash || hash.length < length * 2) return hash || '';
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}
