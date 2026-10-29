export type UserRole = 
  | 'super_admin' 
  | 'prosecutor' 
  | 'lawyer' 
  | 'investigator' 
  | 'viewer' 
  | 'org_admin'   // legacy administrative alias
  | 'reviewer';   // legacy reviewer alias

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  prosecutor: 'Prosecutor',
  lawyer: 'Lawyer / Counsel',
  investigator: 'Investigator',
  viewer: 'Viewer / Legal Researcher',
  org_admin: 'Court Registrar / Admin',
  reviewer: 'Investigator (Reviewer)',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full institutional authority: user governance, system configuration, case oversight, and audit certification.',
  prosecutor: 'Access assigned prosecution dockets, cross-examine evidence, and search state exhibits.',
  lawyer: 'Manage assigned defense and client matters, ingest exhibits, search testimonies, and annotate records.',
  investigator: 'Investigate assigned active dockets, upload forensic recordings, and analyze transcripts.',
  viewer: 'Read-only examination of authorized case exhibits and transcripts without modification rights.',
  org_admin: 'Registry administration, case docketing, and institutional evidence vault oversight.',
  reviewer: 'Forensic review of assigned investigative transcripts and exhibit ledgers.',
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  barNumber?: string; // Ghana Bar Association enrollment number
  division?: string;  // e.g. "Commercial Division, High Court Accra", "Office of the Attorney General"
  accountType?: 'individual' | 'organization' | 'court';
  accountStatus?: 'active' | 'pending_verification' | 'suspended';
  emailVerified?: boolean;
  activeWorkspaceId?: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  code: string; // e.g. "AG-GH", "ACC-HC-COM"
  type: 'court' | 'ministry' | 'law_firm' | 'investigative_agency';
  contactEmail: string;
  jurisdiction: string;
  createdAt: string;
}
