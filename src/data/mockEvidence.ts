import { LegalCase } from '../types/case';
import { EvidenceFile } from '../types/evidence';
import { UserProfile } from '../types/auth';

export const MOCK_USERS: UserProfile[] = [
  {
    uid: 'user_super_admin',
    email: 'justice.adinyira@judicial.gov.gh',
    displayName: 'Her Ladyship Justice Sophia Adinyira (Ret.)',
    role: 'super_admin',
    organizationId: 'org_judicial_service',
    organizationName: 'Judicial Service of Ghana - Supreme Court & Superior Courts',
    barNumber: 'GAR/0104/1979',
    division: 'Supreme Court Administration',
    createdAt: '2026-01-10T08:00:00Z',
    lastLoginAt: '2026-10-24T12:00:00Z',
    isActive: true,
  },
  {
    uid: 'user_org_admin',
    email: 'registrar.commercial@court.gov.gh',
    displayName: 'Mr. Benjamin Kwakye (Chief Registrar)',
    role: 'org_admin',
    organizationId: 'org_commercial_court',
    organizationName: 'Commercial Division, High Court of Justice, Accra',
    division: 'Registry & Evidentiary Vault',
    createdAt: '2026-02-01T09:30:00Z',
    lastLoginAt: '2026-10-24T10:15:00Z',
    isActive: true,
  },
  {
    uid: 'user_lawyer',
    email: 'abena.osei@ag.gov.gh',
    displayName: 'Mrs. Abena Osei-Mensah (Chief State Attorney)',
    role: 'lawyer',
    organizationId: 'org_attorney_general',
    organizationName: 'Office of the Attorney-General and Ministry of Justice',
    barNumber: 'GAR/1842/2004',
    division: 'Public Prosecutions Division',
    createdAt: '2026-02-15T11:00:00Z',
    lastLoginAt: '2026-10-24T13:45:00Z',
    isActive: true,
  },
  {
    uid: 'user_reviewer',
    email: 'investigator.eric@cid.police.gov.gh',
    displayName: 'D/C/Insp. Eric Addo (Lead Financial Investigator)',
    role: 'reviewer',
    organizationId: 'org_cid_headquarters',
    organizationName: 'Criminal Investigation Department (CID) Headquarters',
    division: 'Financial & Economic Crimes Bureau',
    createdAt: '2026-03-01T14:00:00Z',
    lastLoginAt: '2026-10-24T11:20:00Z',
    isActive: true,
  },
];

// Clean state: No pre-populated mock evidence or cases
export const MOCK_EVIDENCE_FILES: EvidenceFile[] = [];

export const MOCK_CASES: LegalCase[] = [];
