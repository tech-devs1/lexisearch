export type EvidenceType = 'audio' | 'document';

export type EvidenceStatus = 
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'indexing'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed';

export interface WordTimestamp {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
  confidence: number; // 0.0 - 1.0
}

export interface TranscriptSegment {
  id: string;
  evidenceId: string;
  startTime: number; // seconds
  endTime: number;   // seconds
  speakerLabel?: string; // e.g. "Presiding Judge", "Prosecutor", "Witness (Kofi Mensah)"
  text: string;
  words?: WordTimestamp[];
}

export interface DocumentPage {
  id: string;
  evidenceId: string;
  pageNumber: number;
  text: string;
  headings?: string[];
  isOcr: boolean;
  ocrConfidence?: number; // 0 - 100%
  hasWarnings?: boolean;
}

export interface EvidenceFile {
  id: string;
  caseId: string;
  fileName: string;
  originalFileName: string;
  fileType: EvidenceType;
  mimeType: string;
  storagePath: string;
  fileSizeBytes: number;
  sha256Hash: string;
  uploadedBy: {
    uid: string;
    displayName: string;
    email: string;
  };
  uploadedAt: string;
  status: EvidenceStatus;
  statusMessage?: string;
  processingWarnings?: string[];
  
  // Audio specific metadata
  durationSeconds?: number;
  speakerCount?: number;
  sampleRate?: number;
  segmentsCount?: number;
  
  // Document specific metadata
  pageCount?: number;
  ocrApplied?: boolean;
  
  // Direct access to parsed data for search and display
  segments?: TranscriptSegment[];
  pages?: DocumentPage[];
}
