import { describe, it, expect, beforeEach } from 'vitest';
import { UserProfile } from '../types/auth';
import { LegalCase, CaseMember } from '../types/case';
import { EvidenceFile } from '../types/evidence';
import {
  isUserActive,
  isUserVerified,
  canUserAccessCase,
  canUserAccessEvidence,
  canAssignCaseMembers,
  canManageUsers,
  canCreateCase,
  canUploadEvidence,
} from '../services/rbacService';

describe('GLEIS — Court-Controlled Case Access & Multi-Persona Authorization', () => {
  // Test Personas
  let superAdmin: UserProfile;
  let courtRegistrar: UserProfile;
  let unverifiedCourtUser: UserProfile;
  let lawyerAbena: UserProfile;
  let lawyerKwame: UserProfile;
  let legalResearcher: UserProfile;

  // Test Cases
  let caseA: LegalCase;
  let caseB: LegalCase;
  let evidenceA: EvidenceFile;
  let evidenceB: EvidenceFile;

  beforeEach(() => {
    superAdmin = {
      uid: 'uid_super_admin',
      email: 'chief.justice@judicial.gov.gh',
      displayName: 'Her Ladyship Chief Justice',
      role: 'super_admin',
      accountType: 'court',
      accountStatus: 'active',
      organizationId: 'org_judicial_service',
      organizationName: 'Judicial Service of Ghana',
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: '2026-01-01T00:00:00Z',
      isActive: true,
    };

    courtRegistrar = {
      uid: 'uid_court_registrar',
      email: 'registrar.kwakye@judicial.gov.gh',
      displayName: 'Benjamin Kwakye (High Court Registrar)',
      role: 'org_admin',
      accountType: 'court',
      accountStatus: 'active',
      organizationId: 'org_high_court_accra',
      organizationName: 'High Court Commercial Division, Accra',
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: '2026-01-01T00:00:00Z',
      isActive: true,
    };

    unverifiedCourtUser = {
      uid: 'uid_unverified_applicant',
      email: 'applicant.john@courts.gh',
      displayName: 'John Doe (Registrar Applicant)',
      role: 'viewer', // Protected default
      accountType: 'court',
      accountStatus: 'pending_verification', // Must not have privileges yet
      organizationId: 'org_judicial_service',
      organizationName: 'Judicial Service of Ghana',
      createdAt: '2026-02-01T00:00:00Z',
      lastLoginAt: '2026-02-01T00:00:00Z',
      isActive: true,
    };

    lawyerAbena = {
      uid: 'uid_lawyer_abena',
      email: 'abena.osei@lawchambers.gh',
      displayName: 'Mrs. Abena Osei-Mensah',
      role: 'lawyer',
      accountType: 'individual',
      accountStatus: 'active',
      barNumber: 'GAR-10928/2012',
      organizationId: 'org_osei_chambers',
      organizationName: 'Osei-Mensah & Partners',
      createdAt: '2026-02-15T00:00:00Z',
      lastLoginAt: '2026-02-15T00:00:00Z',
      isActive: true,
    };

    lawyerKwame = {
      uid: 'uid_lawyer_kwame',
      email: 'kwame.boateng@accrabar.gh',
      displayName: 'Kwame Boateng Esq.',
      role: 'lawyer',
      accountType: 'individual',
      accountStatus: 'active',
      barNumber: 'GAR-14522/2018',
      organizationId: 'org_boateng_law',
      organizationName: 'Boateng Legal Consult',
      createdAt: '2026-02-20T00:00:00Z',
      lastLoginAt: '2026-02-20T00:00:00Z',
      isActive: true,
    };

    legalResearcher = {
      uid: 'uid_researcher',
      email: 'kofi.research@ug.edu.gh',
      displayName: 'Kofi Mensah',
      role: 'viewer',
      accountType: 'individual',
      accountStatus: 'active',
      organizationId: 'org_judicial_service',
      organizationName: 'Faculty of Law, University of Ghana',
      createdAt: '2026-03-01T00:00:00Z',
      lastLoginAt: '2026-03-01T00:00:00Z',
      isActive: true,
    };

    // Case A: Republic v. Mensah
    caseA = {
      id: 'case_docket_001',
      caseNumber: 'CR/ACC/0114/2026',
      title: 'The Republic v. Mensah & Ors',
      description: 'Criminal breach of trust and financial indictment',
      court: 'High Court (Criminal Division 2), Accra',
      presidingJudge: 'Hon. Justice Sophia Adinyira',
      organizationId: 'org_high_court_accra',
      status: 'in_trial',
      createdAt: '2026-03-01T08:00:00Z',
      updatedAt: '2026-03-01T08:00:00Z',
      createdBy: {
        uid: courtRegistrar.uid,
        displayName: courtRegistrar.displayName,
        email: courtRegistrar.email,
      },
      members: [], // initially unassigned
      evidence: [],
    };

    // Case B: Standard Bank v. Apex Logistics
    caseB = {
      id: 'case_docket_002',
      caseNumber: 'COMM/ACC/0488/2026',
      title: 'Standard Chartered Bank Ghana PLC v. Apex Logistics Ltd',
      description: 'Commercial debt recovery and letter of credit breach',
      court: 'High Court (Commercial Division 1), Accra',
      presidingJudge: 'Hon. Justice Kwaku Baffour',
      organizationId: 'org_high_court_accra',
      status: 'pre_trial',
      createdAt: '2026-03-05T08:00:00Z',
      updatedAt: '2026-03-05T08:00:00Z',
      createdBy: {
        uid: courtRegistrar.uid,
        displayName: courtRegistrar.displayName,
        email: courtRegistrar.email,
      },
      members: [
        {
          uid: lawyerAbena.uid,
          email: lawyerAbena.email,
          displayName: lawyerAbena.displayName,
          role: 'lead_counsel',
          assignedAt: '2026-03-06T00:00:00Z',
        },
      ],
      evidence: [],
    };

    evidenceA = {
      id: 'ev_audio_001',
      caseId: caseA.id,
      fileName: 'trial_recording_day1.mp3',
      fileType: 'audio',
      fileSizeBytes: 12500000,
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'completed',
      segments: [],
    };
    caseA.evidence = [evidenceA];

    evidenceB = {
      id: 'ev_doc_002',
      caseId: caseB.id,
      fileName: 'commercial_contract_exhibit_b.pdf',
      fileType: 'document',
      fileSizeBytes: 4200000,
      sha256Hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      status: 'completed',
      pages: [],
    };
    caseB.evidence = [evidenceB];
  });

  describe('1. Privilege Escalation Prevention on Signup', () => {
    it('should NOT grant registrar powers to an applicant merely because they selected Court during signup', () => {
      expect(unverifiedCourtUser.accountStatus).toBe('pending_verification');
      expect(isUserVerified(unverifiedCourtUser)).toBe(false);

      // Unverified account must NOT be permitted to assign members
      expect(canAssignCaseMembers(unverifiedCourtUser, caseA)).toBe(false);

      // Unverified account must NOT be permitted to manage users
      expect(canManageUsers(unverifiedCourtUser)).toBe(false);

      // Unverified account must NOT be permitted to create official cases
      expect(canCreateCase(unverifiedCourtUser)).toBe(false);
    });

    it('should grant registrar administration only after Super Admin verifies and activates the account', () => {
      // Simulate Super Admin verification
      const verifiedRegistrar: UserProfile = {
        ...unverifiedCourtUser,
        role: 'org_admin',
        accountStatus: 'active',
      };

      expect(isUserVerified(verifiedRegistrar)).toBe(true);
      expect(canAssignCaseMembers(verifiedRegistrar, caseA)).toBe(true);
      expect(canManageUsers(verifiedRegistrar)).toBe(true);
      expect(canCreateCase(verifiedRegistrar)).toBe(true);
    });
  });

  describe('2. Court Registrar Case Assignment Workflow', () => {
    it('should allow authorized court registrar to assign registered lawyer to a case docket', () => {
      expect(canAssignCaseMembers(courtRegistrar, caseA)).toBe(true);

      // Before assignment: Lawyer Abena has no access to Case A
      expect(canUserAccessCase(lawyerAbena, caseA)).toBe(false);
      expect(canUserAccessEvidence(lawyerAbena, caseA, evidenceA)).toBe(false);

      // Registrar assigns Lawyer Abena
      const assignment: CaseMember = {
        uid: lawyerAbena.uid,
        email: lawyerAbena.email,
        displayName: lawyerAbena.displayName,
        role: 'lead_counsel',
        assignedAt: new Date().toISOString(),
      };
      caseA.members.push(assignment);

      // After assignment: Lawyer Abena has full judicial access to Case A
      expect(canUserAccessCase(lawyerAbena, caseA)).toBe(true);
      expect(canUserAccessEvidence(lawyerAbena, caseA, evidenceA)).toBe(true);
      expect(canUploadEvidence(lawyerAbena, caseA)).toBe(true);
    });

    it('should keep other lawyers completely locked out of Case A', () => {
      // Assign Lawyer Abena
      caseA.members.push({
        uid: lawyerAbena.uid,
        email: lawyerAbena.email,
        displayName: lawyerAbena.displayName,
        role: 'counsel',
        assignedAt: new Date().toISOString(),
      });

      // Lawyer Kwame was never assigned to Case A
      expect(canUserAccessCase(lawyerKwame, caseA)).toBe(false);
      expect(canUserAccessEvidence(lawyerKwame, caseA, evidenceA)).toBe(false);
      expect(canUploadEvidence(lawyerKwame, caseA)).toBe(false);
    });
  });

  describe('3. Instant Revocation & Negative Authorization', () => {
    beforeEach(() => {
      // Give Abena access to Case A
      caseA.members.push({
        uid: lawyerAbena.uid,
        email: lawyerAbena.email,
        displayName: lawyerAbena.displayName,
        role: 'lead_counsel',
        assignedAt: new Date().toISOString(),
      });
    });

    it('should instantly revoke access when registrar removes lawyer from case', () => {
      expect(canUserAccessCase(lawyerAbena, caseA)).toBe(true);
      expect(canUserAccessEvidence(lawyerAbena, caseA, evidenceA)).toBe(true);

      // Registrar revokes assignment
      caseA.members = caseA.members.filter((m) => m.uid !== lawyerAbena.uid);

      // Access is IMMEDIATELY denied on server/logic layer
      expect(canUserAccessCase(lawyerAbena, caseA)).toBe(false);
      expect(canUserAccessEvidence(lawyerAbena, caseA, evidenceA)).toBe(false);
      expect(canUploadEvidence(lawyerAbena, caseA)).toBe(false);
    });

    it('should NOT affect access to other independently assigned cases when revoked from one', () => {
      // Abena is on both Case A and Case B
      expect(canUserAccessCase(lawyerAbena, caseA)).toBe(true);
      expect(canUserAccessCase(lawyerAbena, caseB)).toBe(true);

      // Registrar revokes Abena from Case A only
      caseA.members = caseA.members.filter((m) => m.uid !== lawyerAbena.uid);

      // Case A is denied
      expect(canUserAccessCase(lawyerAbena, caseA)).toBe(false);
      expect(canUserAccessEvidence(lawyerAbena, caseA, evidenceA)).toBe(false);

      // Case B remains fully accessible and unaffected
      expect(canUserAccessCase(lawyerAbena, caseB)).toBe(true);
      expect(canUserAccessEvidence(lawyerAbena, caseB, evidenceB)).toBe(true);
    });
  });

  describe('4. Read-Only Viewer / Legal Researcher Role Enforcement', () => {
    it('should allow assigned legal researcher to view evidence but strictly forbid uploading or tampering', () => {
      // Assign researcher to Case A as viewer
      caseA.members.push({
        uid: legalResearcher.uid,
        email: legalResearcher.email,
        displayName: legalResearcher.displayName,
        role: 'viewer',
        assignedAt: new Date().toISOString(),
      });

      // Permitted to examine case and evidence
      expect(canUserAccessCase(legalResearcher, caseA)).toBe(true);
      expect(canUserAccessEvidence(legalResearcher, caseA, evidenceA)).toBe(true);

      // Strictly FORBIDDEN from uploading evidence
      expect(canUploadEvidence(legalResearcher, caseA)).toBe(false);
      // Strictly FORBIDDEN from assigning members
      expect(canAssignCaseMembers(legalResearcher, caseA)).toBe(false);
    });
  });
});
