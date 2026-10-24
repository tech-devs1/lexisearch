export type UserRole = 'super_admin' | 'org_admin' | 'lawyer' | 'reviewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  barNumber?: string; // Ghana Bar Association enrollment number
  division?: string;  // e.g. "Commercial Division, High Court Accra", "Office of the Attorney General"
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
