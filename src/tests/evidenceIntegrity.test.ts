import { describe, it, expect } from 'vitest';
import { calculateTextSha256, formatHashTruncated } from '../services/crypto';
import { globalAuditService } from '../services/auditService';

describe('Evidence Integrity & Cryptographic Hashing Service', () => {
  it('should compute deterministic SHA-256 hashes for legal texts', async () => {
    const textA = 'The Republic v. Kwame Mensah & 2 Ors - Exhibit P7';
    const textB = 'The Republic v. Kwame Mensah & 2 Ors - Exhibit P7';
    const textC = 'The Republic v. Kwame Mensah & 2 Ors - Exhibit P7 (Tampered)';

    const hashA = await calculateTextSha256(textA);
    const hashB = await calculateTextSha256(textB);
    const hashC = await calculateTextSha256(textC);

    expect(hashA).toHaveLength(64);
    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(hashC);
  });

  it('should format SHA-256 hash for courtroom verification display', () => {
    const fullHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const truncated = formatHashTruncated(fullHash, 8);
    expect(truncated).toBe('e3b0c442...7852b855');
  });

  it('should record tamper-evident audit log entries with verifiable checksums', async () => {
    const entry = await globalAuditService.logAction({
      caseId: 'case_test_001',
      action: 'EVIDENCE_UPLOAD',
      actionDescription: 'Test audio file upload',
      userId: 'user_lawyer',
      userEmail: 'abena.osei@ag.gov.gh',
      userRole: 'lawyer',
      evidenceId: 'ev_001',
      evidenceSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });

    expect(entry.id).toBeDefined();
    expect(entry.integrityChecksum).toHaveLength(64);

    const isAuthentic = await globalAuditService.verifyLogIntegrity(entry);
    expect(isAuthentic).toBe(true);

    // Tampering test: alter payload and verify check fails
    const tampered = { ...entry, actionDescription: 'Tampered action text' };
    const checkTampered = await globalAuditService.verifyLogIntegrity(tampered);
    expect(checkTampered).toBe(false);
  });
});
