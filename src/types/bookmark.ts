import { EvidenceType } from './evidence';

export interface Bookmark {
  id: string;
  caseId: string;
  evidenceId: string;
  fileName: string;
  type: EvidenceType;
  
  // Specific location pointers
  timestamp?: number;        // in seconds (for audio)
  timestampDisplay?: string; // "14:20"
  pageNumber?: number;       // for document
  
  passageSnippet: string;
  note: string;
  tags?: string[];
  
  createdBy: {
    uid: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
