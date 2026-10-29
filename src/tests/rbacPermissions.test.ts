import { describe, it, expect } from 'vitest';
import {
  isUserActive,
  canViewAllCases,
  canCreateCase,
  canEditCase,
  canUploadEvidence,
  canDeleteEvidence,
  canManageUsers,
  canManageSettings,
  canExportAuditLogs,
  canAssignCaseMembers,
  canUserAccessCase,
  canUserAccessEvidence,
} from '../services/rbacService';
import { UserProfile, UserRole } from '../types/auth';
import { LegalCase } from '../types/case';
import { EvidenceFile } from '../types/evidence';

// Factory helper for test users
const makeUser = (
  role: UserRole,
  uid = `user_${role}`,
  isActive = true
): UserProfile => ({
  uid,
  email: `${uid}@judicial.gov.gh`,
  displayName: `Test ${role}`,
  role,
  organizationId: 'org_ghana_judiciary',
  organizationName: 'Judicial Service of Ghana',
  createdAt: '2026-01-01T00:00:00Z',
  lastLoginAt: '2026-01-01T00:00:00Z',
  isActive,
});

// Factory helper for test cases
const makeCase = (
  id = 'case_001',
  createdBy = 'user_lawyer',
  members: LegalCase['members'] = []
): LegalCase => ({
  id,
  caseNumber: 'HC/CR/2026/01',
  suitNumber: 'CR/01/2026',
  title: 'The Republic v. Mensah & Others',
  court: 'High Court Criminal Division, Accra',
  description: 'Criminal matter',
  organizationId: 'org_ghana_judiciary',
  status: 'in_trial',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: {
    uid: createdBy,
    displayName: 'Case Creator',
    email: `${createdBy}@judicial.gov.gh`,
  },
  members,
  evidence: [],
});

describe('Ghana Legal Evidence Intelligence System - RBAC Engine', () => {
  const superAdmin = makeUser('super_admin');
  const prosecutor = makeUser('prosecutor');
  const lawyer = makeUser('lawyer');
  const investigator = makeUser('investigator');
  const viewer = makeUser('viewer');
  const orgAdmin = makeUser('org_admin');
  const reviewer = makeUser('reviewer');
  const deactivatedLawyer = makeUser('lawyer', 'user_deactivated', false);

  describe('1. User Activation Verification (isUserActive)', () => {
    it('should identify active accounts correctly', () => {
      expect(isUserActive(superAdmin)).toBe(true);
      expect(isUserActive(prosecutor)).toBe(true);
      expect(isUserActive(lawyer)).toBe(true);
    });

    it('should identify deactivated accounts as inactive', () => {
      expect(isUserActive(deactivatedLawyer)).toBe(false);
      expect(isUserActive(null)).toBe(false);
      expect(isUserActive(undefined)).toBe(false);
    });
  });

  describe('2. Global Case Oversight (canViewAllCases)', () => {
    it('should allow Super Admin and Org Admin to view all cases globally', () => {
      expect(canViewAllCases(superAdmin)).toBe(true);
      expect(canViewAllCases(orgAdmin)).toBe(true);
    });

    it('should deny case-wide view to operational roles without explicit case membership', () => {
      expect(canViewAllCases(prosecutor)).toBe(false);
      expect(canViewAllCases(lawyer)).toBe(false);
      expect(canViewAllCases(investigator)).toBe(false);
      expect(canViewAllCases(viewer)).toBe(false);
      expect(canViewAllCases(reviewer)).toBe(false);
    });

    it('should deny deactivated accounts regardless of role', () => {
      const deactivatedAdmin = makeUser('super_admin', 'user_dead_admin', false);
      expect(canViewAllCases(deactivatedAdmin)).toBe(false);
    });
  });

  describe('3. Legal Case Creation (canCreateCase)', () => {
    it('should permit Super Admin, Org Admin, Prosecutor, and Lawyer to create cases', () => {
      expect(canCreateCase(superAdmin)).toBe(true);
      expect(canCreateCase(orgAdmin)).toBe(true);
      expect(canCreateCase(prosecutor)).toBe(true);
      expect(canCreateCase(lawyer)).toBe(true);
    });

    it('should forbid Investigator, Reviewer, and Viewer from creating dockets', () => {
      expect(canCreateCase(investigator)).toBe(false);
      expect(canCreateCase(viewer)).toBe(false);
      expect(canCreateCase(reviewer)).toBe(false);
    });

    it('should strictly deny deactivated users from creating cases', () => {
      expect(canCreateCase(deactivatedLawyer)).toBe(false);
    });
  });

  describe('4. Case Editing and Modification (canEditCase)', () => {
    const testCase = makeCase('case_001', lawyer.uid, [
      {
        uid: prosecutor.uid,
        displayName: prosecutor.displayName,
        email: prosecutor.email,
        role: 'prosecutor',
        assignedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    it('should permit Super Admin and Org Admin to edit any case', () => {
      expect(canEditCase(superAdmin, testCase)).toBe(true);
      expect(canEditCase(orgAdmin, testCase)).toBe(true);
    });

    it('should permit case creator to edit their own matter', () => {
      expect(canEditCase(lawyer, testCase)).toBe(true);
    });

    it('should permit assigned prosecutor/counsel to edit assigned matter', () => {
      expect(canEditCase(prosecutor, testCase)).toBe(true);
    });

    it('should deny unassigned lawyers or prosecutors from editing', () => {
      const otherLawyer = makeUser('lawyer', 'user_other_lawyer');
      expect(canEditCase(otherLawyer, testCase)).toBe(false);
    });

    it('should deny investigators and viewers from editing case details', () => {
      const assignedInvestigator = makeCase('case_002', 'admin', [
        {
          uid: investigator.uid,
          displayName: investigator.displayName,
          email: investigator.email,
          role: 'investigator',
          assignedAt: '2026-01-01T00:00:00Z',
        },
      ]);
      expect(canEditCase(investigator, assignedInvestigator)).toBe(false);
      expect(canEditCase(viewer, testCase)).toBe(false);
    });
  });

  describe('5. Evidence Upload Operations (canUploadEvidence)', () => {
    const assignedCase = makeCase('case_003', 'system_lead', [
      {
        uid: investigator.uid,
        displayName: investigator.displayName,
        email: investigator.email,
        role: 'investigator',
        assignedAt: '2026-01-01T00:00:00Z',
      },
      {
        uid: viewer.uid,
        displayName: viewer.displayName,
        email: viewer.email,
        role: 'viewer',
        assignedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    it('should permit Super Admin and Org Admin to upload evidence', () => {
      expect(canUploadEvidence(superAdmin, assignedCase)).toBe(true);
      expect(canUploadEvidence(orgAdmin, assignedCase)).toBe(true);
    });

    it('should permit assigned Investigator to upload evidence exhibits', () => {
      expect(canUploadEvidence(investigator, assignedCase)).toBe(true);
    });

    it('should STRICTLY DENY Viewer / Researcher from uploading evidence', () => {
      expect(canUploadEvidence(viewer, assignedCase)).toBe(false);
    });

    it('should deny unassigned investigators from uploading to cases', () => {
      const otherInvestigator = makeUser('investigator', 'user_other_inv');
      expect(canUploadEvidence(otherInvestigator, assignedCase)).toBe(false);
    });
  });

  describe('6. Evidence Deletion Operations (canDeleteEvidence)', () => {
    it('should ONLY permit Super Admin to delete evidence for chain of custody protection', () => {
      expect(canDeleteEvidence(superAdmin)).toBe(true);
      expect(canDeleteEvidence(orgAdmin)).toBe(false);
      expect(canDeleteEvidence(prosecutor)).toBe(false);
      expect(canDeleteEvidence(lawyer)).toBe(false);
      expect(canDeleteEvidence(investigator)).toBe(false);
      expect(canDeleteEvidence(viewer)).toBe(false);
    });
  });

  describe('7. Administrative Authority (canManageUsers & canManageSettings)', () => {
    it('should allow Super Admin and Org Admin to manage users', () => {
      expect(canManageUsers(superAdmin)).toBe(true);
      expect(canManageUsers(orgAdmin)).toBe(true);
      expect(canManageUsers(prosecutor)).toBe(false);
      expect(canManageUsers(lawyer)).toBe(false);
      expect(canManageUsers(investigator)).toBe(false);
      expect(canManageUsers(viewer)).toBe(false);
    });

    it('should restrict system settings configuration to Super Admin ONLY', () => {
      expect(canManageSettings(superAdmin)).toBe(true);
      expect(canManageSettings(orgAdmin)).toBe(false);
      expect(canManageSettings(prosecutor)).toBe(false);
      expect(canManageSettings(lawyer)).toBe(false);
    });
  });

  describe('8. Case-Level Isolation (canUserAccessCase)', () => {
    const restrictedCase = makeCase('case_isolated_001', 'user_judge_01', [
      {
        uid: lawyer.uid,
        displayName: lawyer.displayName,
        email: lawyer.email,
        role: 'lead_counsel',
        assignedAt: '2026-01-01T00:00:00Z',
      },
      {
        uid: viewer.uid,
        displayName: viewer.displayName,
        email: viewer.email,
        role: 'viewer',
        assignedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    it('should allow Super Admin to access any case regardless of assignment', () => {
      expect(canUserAccessCase(superAdmin, restrictedCase)).toBe(true);
    });

    it('should allow assigned members (Lawyer, Viewer) to access the case', () => {
      expect(canUserAccessCase(lawyer, restrictedCase)).toBe(true);
      expect(canUserAccessCase(viewer, restrictedCase)).toBe(true);
    });

    it('should strictly BLOCK unassigned officers (Prosecutor, Investigator) from accessing the case', () => {
      expect(canUserAccessCase(prosecutor, restrictedCase)).toBe(false);
      expect(canUserAccessCase(investigator, restrictedCase)).toBe(false);
    });

    it('should strictly BLOCK deactivated accounts even if assigned to the case', () => {
      const deactivatedAssignedLawyer = makeUser('lawyer', lawyer.uid, false);
      expect(canUserAccessCase(deactivatedAssignedLawyer, restrictedCase)).toBe(false);
    });

    it('should return false for null user or null case (defensive gate)', () => {
      expect(canUserAccessCase(null, restrictedCase)).toBe(false);
      expect(canUserAccessCase(lawyer, null)).toBe(false);
    });
  });

  describe('9. Evidence Asset Isolation (canUserAccessEvidence)', () => {
    const parentCase = makeCase('case_ev_001', 'judge_02', [
      {
        uid: lawyer.uid,
        displayName: lawyer.displayName,
        email: lawyer.email,
        role: 'counsel',
        assignedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    const evidenceAsset: EvidenceFile = {
      id: 'ev_001',
      caseId: 'case_ev_001',
      fileName: 'witness_interview_tape.mp3',
      fileType: 'audio',
      fileSizeBytes: 10485760,
      sha256Hash: 'a1b2c3d4e5f6',
      uploadedAt: '2026-01-01T00:00:00Z',
      uploadedBy: 'officer_01',
      status: 'completed',
    };

    it('should allow authorized case members to access evidence files', () => {
      expect(canUserAccessEvidence(lawyer, parentCase, evidenceAsset)).toBe(true);
      expect(canUserAccessEvidence(superAdmin, parentCase, evidenceAsset)).toBe(true);
    });

    it('should BLOCK unauthorized officers from accessing evidence asset', () => {
      expect(canUserAccessEvidence(prosecutor, parentCase, evidenceAsset)).toBe(false);
      expect(canUserAccessEvidence(investigator, parentCase, evidenceAsset)).toBe(false);
      expect(canUserAccessEvidence(viewer, parentCase, evidenceAsset)).toBe(false);
    });
  });

  describe('10. Audit Log Export Certification (canExportAuditLogs)', () => {
    it('should permit legal practitioners and admins to export certified audit logs', () => {
      expect(canExportAuditLogs(superAdmin)).toBe(true);
      expect(canExportAuditLogs(orgAdmin)).toBe(true);
      expect(canExportAuditLogs(prosecutor)).toBe(true);
      expect(canExportAuditLogs(lawyer)).toBe(true);
    });

    it('should deny viewers and investigators from exporting systemic audit logs', () => {
      expect(canExportAuditLogs(viewer)).toBe(false);
      expect(canExportAuditLogs(investigator)).toBe(false);
    });
  });
});
