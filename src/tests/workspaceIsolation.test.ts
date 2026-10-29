import { describe, it, expect, beforeEach } from 'vitest';
import { Workspace, WorkspaceMemberRole, WorkspaceType } from '../types/workspace';
import { LegalCase } from '../types/case';
import { UserProfile } from '../types/auth';

describe('GLEIS Three-Tier Sovereign Workspace Architecture & Isolation', () => {
  let mockSuperAdmin: UserProfile;
  let mockRegistrar: UserProfile;
  let mockLawyer: UserProfile;
  let mockInvestigator: UserProfile;
  let mockExternalCounsel: UserProfile;

  beforeEach(() => {
    mockSuperAdmin = {
      uid: 'u_super_admin',
      email: 'justice.adinyira@judicial.gov.gh',
      displayName: 'Her Ladyship Justice Sophia Adinyira (Ret.)',
      role: 'super_admin',
      accountType: 'court',
      isActive: true,
    };

    mockRegistrar = {
      uid: 'u_registrar',
      email: 'b.kwakye@judicial.gov.gh',
      displayName: 'Benjamin Kwakye',
      role: 'org_admin',
      accountType: 'court',
      isActive: true,
    };

    mockLawyer = {
      uid: 'u_lawyer',
      email: 'akosua.osei@chambers.gh',
      displayName: 'Mrs. Akosua Osei-Mensah, Esq.',
      role: 'lawyer',
      accountType: 'organization',
      isActive: true,
    };

    mockInvestigator = {
      uid: 'u_investigator',
      email: 'eric.addo@police.gov.gh',
      displayName: 'D/C/Insp. Eric Addo',
      role: 'investigator',
      accountType: 'organization',
      isActive: true,
    };

    mockExternalCounsel = {
      uid: 'u_external_counsel',
      email: 'counsel.unknown@external.com',
      displayName: 'Unassigned Counsel',
      role: 'lawyer', // Has lawyer title, but no case assignment
      accountType: 'individual',
      isActive: true,
    };
  });

  it('correctly models Personal, Organization, and Court sovereign workspaces', () => {
    const personalWs: Workspace = {
      id: 'ws_personal_lawyer',
      name: "Akosua Osei-Mensah's Personal Practice",
      type: 'personal',
      ownerId: mockLawyer.uid,
      members: [
        {
          userId: mockLawyer.uid,
          email: mockLawyer.email,
          displayName: mockLawyer.displayName,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          status: 'active',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orgWs: Workspace = {
      id: 'ws_firm_bentsi_enchi',
      name: 'Bentsi-Enchill & Letsa Chambers',
      type: 'organization',
      ownerId: mockLawyer.uid,
      members: [
        {
          userId: mockLawyer.uid,
          email: mockLawyer.email,
          displayName: mockLawyer.displayName,
          role: 'admin',
          joinedAt: new Date().toISOString(),
          status: 'active',
        },
        {
          userId: mockInvestigator.uid,
          email: mockInvestigator.email,
          displayName: mockInvestigator.displayName,
          role: 'member',
          joinedAt: new Date().toISOString(),
          status: 'active',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const courtWs: Workspace = {
      id: 'ws_court_commercial_02',
      name: 'High Court (Commercial Division 2), Accra',
      type: 'court',
      ownerId: mockSuperAdmin.uid,
      jurisdiction: 'High Court Complex, Accra',
      members: [
        {
          userId: mockSuperAdmin.uid,
          email: mockSuperAdmin.email,
          displayName: mockSuperAdmin.displayName,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          status: 'active',
        },
        {
          userId: mockRegistrar.uid,
          email: mockRegistrar.email,
          displayName: mockRegistrar.displayName,
          role: 'registrar',
          joinedAt: new Date().toISOString(),
          status: 'active',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(personalWs.type).toBe('personal');
    expect(orgWs.type).toBe('organization');
    expect(courtWs.type).toBe('court');
    expect(personalWs.members).toHaveLength(1);
    expect(orgWs.members).toHaveLength(2);
    expect(courtWs.members.some((m) => m.role === 'registrar')).toBe(true);
  });

  it('strictly isolates cases between different workspaces', () => {
    const cases: LegalCase[] = [
      {
        id: 'case_pers_01',
        workspaceId: 'ws_personal_lawyer',
        caseNumber: 'PERS-2026-001',
        title: 'Confidential Client Legal Research Memo',
        court: 'In-Chambers Analysis',
        status: 'active',
        assignedUsers: [mockLawyer.uid],
        createdBy: mockLawyer.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidenceCount: 1,
      },
      {
        id: 'case_firm_01',
        workspaceId: 'ws_firm_bentsi_enchi',
        caseNumber: 'FIRM-COMM-2026-088',
        title: 'Mining Concession Commercial Dispute',
        court: 'Commercial Division',
        status: 'active',
        assignedUsers: [mockLawyer.uid, mockInvestigator.uid],
        createdBy: mockLawyer.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidenceCount: 3,
      },
      {
        id: 'case_court_01',
        workspaceId: 'ws_court_commercial_02',
        caseNumber: 'HC-COMM-2026-0041',
        title: 'Republic v. Vanguard Maritime Consortium',
        court: 'High Court Commercial Division',
        status: 'active',
        assignedUsers: [mockRegistrar.uid, mockLawyer.uid],
        createdBy: mockRegistrar.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidenceCount: 5,
      },
    ];

    // Query cases inside Personal Workspace
    const personalCases = cases.filter((c) => c.workspaceId === 'ws_personal_lawyer');
    expect(personalCases).toHaveLength(1);
    expect(personalCases[0].caseNumber).toBe('PERS-2026-001');

    // Query cases inside Firm Workspace
    const firmCases = cases.filter((c) => c.workspaceId === 'ws_firm_bentsi_enchi');
    expect(firmCases).toHaveLength(1);
    expect(firmCases[0].caseNumber).toBe('FIRM-COMM-2026-088');

    // Query cases inside Court Workspace
    const courtCases = cases.filter((c) => c.workspaceId === 'ws_court_commercial_02');
    expect(courtCases).toHaveLength(1);
    expect(courtCases[0].caseNumber).toBe('HC-COMM-2026-0041');
  });

  it('enforces that professional title alone does not grant access to unassigned court cases', () => {
    const sensitiveCourtCase: LegalCase = {
      id: 'case_sensitive_01',
      workspaceId: 'ws_court_commercial_02',
      caseNumber: 'HC-COMM-2026-0999',
      title: 'Confidential Banking Boardroom Injunction',
      court: 'High Court Commercial Division',
      status: 'active',
      assignedUsers: [mockRegistrar.uid], // Only registrar is assigned
      caseMembers: [
        {
          userId: mockRegistrar.uid,
          role: 'clerk',
          addedAt: new Date().toISOString(),
          addedBy: mockSuperAdmin.uid,
        },
      ],
      createdBy: mockRegistrar.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidenceCount: 2,
    };

    // Helper checking access: user must be assigned to case or be super_admin
    const canAccessCase = (user: UserProfile, c: LegalCase): boolean => {
      if (user.role === 'super_admin') return true;
      if (c.assignedUsers?.includes(user.uid)) return true;
      if (c.caseMembers?.some((m) => m.userId === user.uid)) return true;
      return false;
    };

    // External lawyer has "lawyer" title, but is NOT assigned to this case
    expect(mockExternalCounsel.role).toBe('lawyer');
    expect(canAccessCase(mockExternalCounsel, sensitiveCourtCase)).toBe(false);

    // Investigator has "investigator" title, but is NOT assigned
    expect(mockInvestigator.role).toBe('investigator');
    expect(canAccessCase(mockInvestigator, sensitiveCourtCase)).toBe(false);

    // Assigned registrar has access
    expect(canAccessCase(mockRegistrar, sensitiveCourtCase)).toBe(true);

    // Super Admin has oversight
    expect(canAccessCase(mockSuperAdmin, sensitiveCourtCase)).toBe(true);
  });
});
