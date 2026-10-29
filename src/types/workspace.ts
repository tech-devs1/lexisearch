export type WorkspaceType = 'personal' | 'organization' | 'court';

export type WorkspaceMemberRole = 
  | 'owner' 
  | 'registrar' 
  | 'admin' 
  | 'counsel' 
  | 'investigator' 
  | 'viewer';

export interface WorkspaceMember {
  userId: string;
  email: string;
  displayName: string;
  role: WorkspaceMemberRole;
  joinedAt: string;
  status: 'active' | 'invited' | 'revoked';
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  description?: string;
  code?: string; // e.g. "PERS-01", "FIRM-OM", "CRT-HC-ACC"
  jurisdiction?: string; // e.g. "High Court Criminal Division 2, Accra"
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  invitedEmail: string;
  invitedRole: WorkspaceMemberRole;
  invitedBy: {
    userId: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}
