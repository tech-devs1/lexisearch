export type AuditActionType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_FAILED'
  | 'ACCESS_DENIED'
  | 'USER_ROLE_CHANGED'
  | 'USER_STATUS_CHANGED'
  | 'CASE_ASSIGNMENT'
  | 'EVIDENCE_UPLOAD'
  | 'EVIDENCE_HASH_VERIFIED'
  | 'TRANSCRIPTION_START'
  | 'TRANSCRIPTION_COMPLETE'
  | 'DOCUMENT_OCR_COMPLETE'
  | 'SEARCH_QUERY'
  | 'AUDIO_STREAM'
  | 'DOCUMENT_VIEW'
  | 'BOOKMARK_CREATE'
  | 'CASE_ACCESS'
  | 'PERMISSION_CHANGE'
  | 'EVIDENCE_EXPORT';

export interface AuditLogEntry {
  id: string;
  caseId: string;
  action: AuditActionType;
  actionDescription: string;
  userId: string;
  userEmail: string;
  userRole: string;
  evidenceId?: string;
  evidenceFileName?: string;
  evidenceSha256?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  integrityChecksum: string; // HMAC/Hash proving entry has not been altered
}
