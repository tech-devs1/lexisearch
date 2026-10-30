import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Workspace, WorkspaceMember, WorkspaceMemberRole, WorkspaceType } from '../types/workspace';
import { UserProfile } from '../types/auth';
import { useAuth } from './AuthContext';
import { globalAuditService } from '../services/auditService';

const WORKSPACES_STORAGE_KEY = 'gleis_workspaces_v2';
const ACTIVE_WORKSPACE_STORAGE_KEY = 'gleis_active_ws_v2';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  userWorkspaces: Workspace[];
  switchWorkspace: (workspaceId: string) => void;
  createOrganizationWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  provisionCourtWorkspace: (name: string, jurisdiction: string, registrarUser: UserProfile) => Promise<Workspace | null>;
  inviteMemberToWorkspace: (workspaceId: string, memberUser: UserProfile, role: WorkspaceMemberRole) => Promise<boolean>;
  updateMemberRoleInWorkspace: (workspaceId: string, userId: string, newRole: WorkspaceMemberRole) => Promise<boolean>;
  revokeMemberFromWorkspace: (workspaceId: string, userId: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Initial institutional apex registry workspace (clean state, zero mock workspaces/users)
const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws_crt_supreme_01',
    name: 'Supreme Court & Superior Courts of Ghana',
    type: 'court',
    ownerId: 'user_super_admin',
    description: 'National apex registry, constitutional matters, and superior appellate dockets.',
    code: 'CRT-SC-GH',
    jurisdiction: 'Supreme Court of Ghana, High Street Accra',
    members: [
      {
        userId: 'user_super_admin',
        email: 'supertech@admin.com',
        displayName: 'Super Admin (System Administrator)',
        role: 'owner',
        joinedAt: '2026-01-01T00:00:00Z',
        status: 'active',
      },
    ],
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
];

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();
  const legacyMockWsIds = ['ws_org_law_firm_01', 'ws_org_cid_01'];
  const legacyMockUserIds = ['user_prosecutor', 'user_lawyer', 'user_investigator', 'user_viewer', 'user_org_admin'];

  const isMockWorkspace = (w: Workspace) => {
    if (/sophia adinyira|tuah-yeboah|benjamin kwakye|eric addo/i.test(w.name)) return true;
    if (legacyMockWsIds.includes(w.id)) return true;
    if (legacyMockUserIds.includes(w.ownerId)) return true;
    return false;
  };

  // Registered users on the system, strictly excluding the superadmin
  const registeredNonAdminUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.role !== 'super_admin' &&
        u.email.toLowerCase() !== 'supertech@admin.com' &&
        u.uid !== 'user_super_admin' &&
        u.isActive !== false
    );
  }, [users]);

  // Load all workspaces from local storage or seed, actively purging mock workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(WORKSPACES_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Clean out legacy mock workspaces, mock members, and stale personas
            const cleaned = parsed
              .filter((w: Workspace) => !isMockWorkspace(w))
              .map((w: Workspace) => ({
                ...w,
                members: (w.members || []).filter(
                  (m: WorkspaceMember) => !legacyMockUserIds.includes(m.userId)
                ),
              }));
            if (cleaned.length > 0) return cleaned;
          }
        } catch { /* ignore */ }
      }
    }
    return DEFAULT_WORKSPACES;
  });

  // Ensure every active registered non-admin user has an automatic Personal Workspace
  useEffect(() => {
    if (registeredNonAdminUsers.length === 0) return;
    setWorkspaces((prev) => {
      // First clean out any lingering mock workspaces
      const cleaned = prev.filter((w) => !isMockWorkspace(w));
      let changed = cleaned.length !== prev.length;
      const updated = [...cleaned];

      for (const u of registeredNonAdminUsers) {
        const personalId = `ws_personal_${u.uid}`;
        const exists = updated.some((w) => w.id === personalId || w.ownerId === u.uid);
        if (!exists) {
          changed = true;
          updated.push({
            id: personalId,
            name: `${u.displayName}'s Private Workspace`,
            type: u.accountType === 'court' ? 'court' : u.accountType === 'organization' ? 'organization' : 'personal',
            ownerId: u.uid,
            description: `Official workspace for registered officer ${u.displayName}`,
            code: `PERS-${u.uid.slice(-4).toUpperCase()}`,
            members: [
              {
                userId: u.uid,
                email: u.email,
                displayName: u.displayName,
                role: 'owner',
                joinedAt: u.createdAt || new Date().toISOString(),
                status: 'active',
              },
            ],
            createdAt: u.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      return changed ? updated : prev;
    });
  }, [registeredNonAdminUsers]);

  // Workspaces accessible to current user:
  // For Super Admin, this contains ONLY registered users on the system, strictly excluding the superadmin
  const userWorkspaces = useMemo(() => {
    if (!currentUser) return [];

    // Super admin sees ONLY registered users on the system (excluding superadmin)
    if (currentUser.role === 'super_admin') {
      return registeredNonAdminUsers.map((u) => {
        const wsId = `ws_personal_${u.uid}`;
        const existing = workspaces.find((w) => w.id === wsId || w.ownerId === u.uid);
        if (existing) {
          return {
            ...existing,
            name: `${u.displayName}'s Private Workspace`,
            type: (u.accountType === 'court' ? 'court' : u.accountType === 'organization' ? 'organization' : 'personal') as WorkspaceType,
          };
        }
        const generatedWs: Workspace = {
          id: wsId,
          name: `${u.displayName}'s Private Workspace`,
          type: (u.accountType === 'court' ? 'court' : u.accountType === 'organization' ? 'organization' : 'personal') as WorkspaceType,
          ownerId: u.uid,
          description: `Official workspace for registered officer ${u.displayName}`,
          code: `PERS-${u.uid.slice(-4).toUpperCase()}`,
          members: [
            {
              userId: u.uid,
              email: u.email,
              displayName: u.displayName,
              role: 'owner',
              joinedAt: u.createdAt || new Date().toISOString(),
              status: 'active',
            },
          ],
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return generatedWs;
      });
    }

    // Normal registered users: see their own workspace(s)
    return workspaces.filter((w) => {
      if (isMockWorkspace(w)) return false;
      if (w.ownerId === currentUser.uid) return true;
      return (w.members || []).some(
        (m) =>
          (m.userId === currentUser.uid || m.email.toLowerCase() === currentUser.email.toLowerCase()) &&
          m.status === 'active'
      );
    });
  }, [workspaces, currentUser, registeredNonAdminUsers]);

  // Active workspace state
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      const savedId = localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
      if (savedId) return savedId;
    }
    return DEFAULT_WORKSPACES[0].id;
  });

  // Sync workspaces to storage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
    }
  }, [workspaces]);

  // Save active workspace ID
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  // Derived active workspace (safely resolves to an authorized workspace)
  const activeWorkspace = useMemo(() => {
    const found = userWorkspaces.find((w) => w.id === activeWorkspaceId);
    if (found) return found;
    return userWorkspaces[0] || null;
  }, [userWorkspaces, activeWorkspaceId]);

  // Keep active workspace ID aligned with valid user workspaces
  useEffect(() => {
    if (userWorkspaces.length > 0 && !userWorkspaces.some((w) => w.id === activeWorkspaceId)) {
      setActiveWorkspaceId(userWorkspaces[0].id);
    }
  }, [userWorkspaces, activeWorkspaceId]);

  // Switch workspace
  const switchWorkspace = useCallback((workspaceId: string) => {
    const target = userWorkspaces.find((w) => w.id === workspaceId);
    if (!target) {
      console.warn(`Unauthorized attempt to switch to workspace ${workspaceId}`);
      return;
    }
    setActiveWorkspaceId(workspaceId);
    if (currentUser) {
      globalAuditService.logAction({
        caseId: 'system',
        action: 'PERMISSION_CHANGE',
        actionDescription: `Switched active workspace to "${target.name}" [Type: ${target.type.toUpperCase()}]`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        metadata: { workspaceId: target.id, workspaceType: target.type },
      });
    }
  }, [userWorkspaces, currentUser]);

  // Create an Organization workspace (Law Firm / Agency)
  const createOrganizationWorkspace = async (
    name: string,
    description?: string
  ): Promise<Workspace | null> => {
    if (!currentUser) return null;

    const newWs: Workspace = {
      id: `ws_org_${Date.now()}`,
      name: name.trim(),
      type: 'organization',
      ownerId: currentUser.uid,
      description: description?.trim() || 'Institutional legal organization workspace.',
      code: `FIRM-${Date.now().toString().slice(-4)}`,
      members: [
        {
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          status: 'active',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);

    await globalAuditService.logAction({
      caseId: 'system',
      action: 'PERMISSION_CHANGE',
      actionDescription: `Created Organization Workspace "${newWs.name}"`,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      metadata: { workspaceId: newWs.id },
    });

    return newWs;
  };

  // Provision an official Court workspace (Super Admin only)
  const provisionCourtWorkspace = async (
    name: string,
    jurisdiction: string,
    registrarUser: UserProfile
  ): Promise<Workspace | null> => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      alert('Only a GLEIS Super Admin can provision a verified Court Workspace.');
      return null;
    }

    const courtWs: Workspace = {
      id: `ws_crt_${Date.now()}`,
      name: name.trim(),
      type: 'court',
      ownerId: currentUser.uid,
      description: `Official courtroom docket repository for ${name.trim()}.`,
      code: `CRT-${Date.now().toString().slice(-4)}`,
      jurisdiction: jurisdiction.trim(),
      members: [
        {
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          status: 'active',
        },
        {
          userId: registrarUser.uid,
          email: registrarUser.email,
          displayName: registrarUser.displayName,
          role: 'registrar',
          joinedAt: new Date().toISOString(),
          status: 'active',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWorkspaces((prev) => [...prev, courtWs]);

    await globalAuditService.logAction({
      caseId: 'system',
      action: 'PERMISSION_CHANGE',
      actionDescription: `Provisioned Court Workspace "${courtWs.name}" with Registrar ${registrarUser.displayName}`,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      metadata: { courtWorkspaceId: courtWs.id, registrarId: registrarUser.uid },
    });

    return courtWs;
  };

  // Invite an officer/user to a workspace
  const inviteMemberToWorkspace = async (
    workspaceId: string,
    memberUser: UserProfile,
    role: WorkspaceMemberRole
  ): Promise<boolean> => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) return false;

    // Check authority: user must be owner or registrar
    const currentMember = ws.members.find((m) => m.userId === currentUser?.uid);
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isAuthorized = isSuperAdmin || currentMember?.role === 'owner' || currentMember?.role === 'registrar';

    if (!isAuthorized) {
      alert('You do not have administrative authority to invite members to this workspace.');
      return false;
    }

    const newMember: WorkspaceMember = {
      userId: memberUser.uid,
      email: memberUser.email,
      displayName: memberUser.displayName,
      role,
      joinedAt: new Date().toISOString(),
      status: 'active',
    };

    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== workspaceId) return w;
        const filtered = w.members.filter((m) => m.userId !== memberUser.uid);
        return { ...w, members: [...filtered, newMember], updatedAt: new Date().toISOString() };
      })
    );

    if (currentUser) {
      await globalAuditService.logAction({
        caseId: 'system',
        action: 'CASE_ASSIGNMENT',
        actionDescription: `Added ${memberUser.displayName} as ${role.toUpperCase()} in workspace "${ws.name}"`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        metadata: { workspaceId, targetUserId: memberUser.uid, role },
      });
    }

    return true;
  };

  // Update member role in workspace
  const updateMemberRoleInWorkspace = async (
    workspaceId: string,
    userId: string,
    newRole: WorkspaceMemberRole
  ): Promise<boolean> => {
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== workspaceId) return w;
        return {
          ...w,
          members: w.members.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    return true;
  };

  // Revoke member access from workspace
  const revokeMemberFromWorkspace = async (workspaceId: string, userId: string): Promise<boolean> => {
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id !== workspaceId) return w;
        return {
          ...w,
          members: w.members.map((m) => (m.userId === userId ? { ...m, status: 'revoked' } : m)),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    return true;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        userWorkspaces,
        switchWorkspace,
        createOrganizationWorkspace,
        provisionCourtWorkspace,
        inviteMemberToWorkspace,
        updateMemberRoleInWorkspace,
        revokeMemberFromWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
