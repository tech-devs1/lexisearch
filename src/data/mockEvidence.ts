import { LegalCase } from '../types/case';
import { EvidenceFile } from '../types/evidence';
import { UserProfile } from '../types/auth';

export const MOCK_USERS: UserProfile[] = [
  {
    uid: 'user_super_admin',
    email: 'supertech@admin.com',
    displayName: 'Super Admin (System Administrator)',
    role: 'super_admin',
    organizationId: 'org_judicial_service',
    organizationName: 'Judicial Service of Ghana - Supreme Court & Superior Courts',
    barNumber: 'GAR/0104/1979',
    division: 'Supreme Court Administration & IT Security',
    createdAt: '2026-01-10T08:00:00Z',
    lastLoginAt: '2026-10-24T12:00:00Z',
    isActive: true,
  },
];

// Clean state: No pre-populated mock evidence or cases
export const MOCK_EVIDENCE_FILES: EvidenceFile[] = [];

export const MOCK_CASES: LegalCase[] = [];
