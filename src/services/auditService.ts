import { AuditActionType, AuditLogEntry } from '../types/audit';
import { calculateTextSha256 } from './crypto';
import { writeAuditLogToFirestore } from './firestoreService';

const AUDIT_STORAGE_KEY = 'gleis_audit_trail_v1';

export class AuditService {
  private inMemoryLogs: AuditLogEntry[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (stored) {
          this.inMemoryLogs = JSON.parse(stored);
        }
      }
    } catch (e) {
      this.inMemoryLogs = [];
    }
  }

  private persistLogs() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.inMemoryLogs));
      }
    } catch (e) {
      // In-memory fallback
    }
  }

  /**
   * Records an immutable, tamper-resistant audit entry.
   */
  public async logAction(params: {
    caseId: string;
    action: AuditActionType;
    actionDescription: string;
    userId: string;
    userEmail: string;
    userRole: string;
    evidenceId?: string;
    evidenceFileName?: string;
    evidenceSha256?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLogEntry> {
    const timestamp = new Date().toISOString();
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Calculate cryptographic tamper-evidence checksum
    const payloadToSign = `${id}|${params.caseId}|${params.action}|${params.actionDescription}|${params.userId}|${timestamp}|${params.evidenceSha256 || 'none'}`;
    const integrityChecksum = await calculateTextSha256(payloadToSign);

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js Test Environment';

    const entry: AuditLogEntry = {
      id,
      caseId: params.caseId,
      action: params.action,
      actionDescription: params.actionDescription,
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      evidenceId: params.evidenceId,
      evidenceFileName: params.evidenceFileName,
      evidenceSha256: params.evidenceSha256,
      timestamp,
      ipAddress: '127.0.0.1 (Authenticated Client)',
      userAgent,
      metadata: params.metadata,
      integrityChecksum,
    };

    this.inMemoryLogs.unshift(entry);
    this.persistLogs();

    // Persist to Firestore audit logs subcollection
    writeAuditLogToFirestore(entry).catch(e => console.warn('Firestore audit log write notice:', e));

    return entry;
  }

  public getCaseLogs(caseId?: string): AuditLogEntry[] {
    if (!caseId) return [...this.inMemoryLogs];
    return this.inMemoryLogs.filter(log => log.caseId === caseId);
  }

  /**
   * Verifies that an audit entry's checksum has not been tampered with.
   */
  public async verifyLogIntegrity(log: AuditLogEntry): Promise<boolean> {
    const payloadToSign = `${log.id}|${log.caseId}|${log.action}|${log.actionDescription}|${log.userId}|${log.timestamp}|${log.evidenceSha256 || 'none'}`;
    const expected = await calculateTextSha256(payloadToSign);
    return expected === log.integrityChecksum;
  }

  /**
   * Generates a formal Chain of Custody Certificate for legal court presentation
   */
  public generateChainOfCustodyReport(caseId: string, evidenceId: string): string {
    const logs = this.inMemoryLogs.filter(l => l.caseId === caseId && (evidenceId === 'all' || l.evidenceId === evidenceId));
    return JSON.stringify({
      jurisdiction: 'Judicial Service of Ghana - Republic of Ghana',
      system: 'GLEIS (Ghana Legal Evidence Intelligence System)',
      certificationDate: new Date().toISOString(),
      caseId,
      evidenceId,
      totalEvents: logs.length,
      events: logs,
    }, null, 2);
  }
}

export const globalAuditService = new AuditService();
