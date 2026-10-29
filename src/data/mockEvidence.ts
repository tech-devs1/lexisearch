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
    uid: 'user_prosecutor',
    email: 'prosecutor.alfred@ag.gov.gh',
    displayName: 'Hon. Alfred Tuah-Yeboah (State Prosecutor)',
    role: 'prosecutor',
    organizationId: 'org_attorney_general',
    organizationName: 'Office of the Attorney-General & Ministry of Justice',
    barNumber: 'GAR/2105/2002',
    division: 'Directorate of Public Prosecutions',
    createdAt: '2026-02-05T09:00:00Z',
    lastLoginAt: '2026-10-25T11:30:00Z',
    isActive: true,
  },
  {
    uid: 'user_lawyer',
    email: 'abena.osei@lawchambers.gh',
    displayName: 'Mrs. Abena Osei-Mensah (Senior Counsel)',
    role: 'lawyer',
    organizationId: 'org_defense_bar',
    organizationName: 'Osei-Mensah & Associates (Advocates & Solicitors)',
    barNumber: 'GAR/1842/2004',
    division: 'Commercial & Criminal Litigation Chambers',
    createdAt: '2026-02-15T11:00:00Z',
    lastLoginAt: '2026-10-24T13:45:00Z',
    isActive: true,
  },
  {
    uid: 'user_investigator',
    email: 'investigator.eric@cid.police.gov.gh',
    displayName: 'D/C/Insp. Eric Addo (Lead Financial Investigator)',
    role: 'investigator',
    organizationId: 'org_cid_headquarters',
    organizationName: 'Criminal Investigation Department (CID) Headquarters',
    division: 'Financial & Economic Crimes Bureau',
    createdAt: '2026-03-01T14:00:00Z',
    lastLoginAt: '2026-10-24T11:20:00Z',
    isActive: true,
  },
  {
    uid: 'user_viewer',
    email: 'kofi.mensah@judicial.gov.gh',
    displayName: 'Kofi Mensah (Supreme Court Legal Researcher)',
    role: 'viewer',
    organizationId: 'org_judicial_service',
    organizationName: 'Judicial Training Institute & Supreme Court Library',
    division: 'Legal Research & Jurisprudence Bureau',
    createdAt: '2026-03-10T10:00:00Z',
    lastLoginAt: '2026-10-26T09:15:00Z',
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
];

// Clean state: No pre-populated mock evidence or cases
export const MOCK_EVIDENCE_FILES: EvidenceFile[] = [];

export const MOCK_CASES: LegalCase[] = [];
