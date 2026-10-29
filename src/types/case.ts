import { EvidenceFile } from './evidence';

export type CaseStatus = 'investigation' | 'pre_trial' | 'in_trial' | 'judgement_reserved' | 'closed';

export interface CaseMember {
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'lead_counsel' | 'counsel' | 'prosecutor' | 'investigator' | 'viewer';
  assignedAt: string;
}

export interface LegalCase {
  id: string;
  caseNumber: string; // e.g. "CR/ACC/0482/2026", "FTC/012/2026"
  suitNumber?: string;
  title: string;      // e.g. "The Republic v. Kwame Boateng & 2 Ors"
  description: string;
  court: string;      // e.g. "High Court of Justice (Criminal Division 2), Accra"
  presidingJudge?: string;
  organizationId: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    uid: string;
    displayName: string;
    email: string;
  };
  members: CaseMember[];
  evidenceCount?: {
    audio: number;
    documents: number;
    total: number;
  };
  evidence?: EvidenceFile[];
}
