import { UserProfile, UserRole } from '../types/auth';
import { LegalCase } from '../types/case';
import { EvidenceFile } from '../types/evidence';

/**
 * Checks if a user has active status and valid profile.
 */
export function isUserActive(user: UserProfile | null): boolean {
  return !!user && user.isActive === true;
}

/**
 * Checks if user has permission to view all cases globally (Super Admin / Court Admin).
 */
export function canViewAllCases(user: UserProfile | null): boolean {
  if (!isUserActive(user)) return false;
  return ['super_admin', 'org_admin'].includes(user!.role);
}

/**
 * Checks if user has permission to create a new case docket.
 * Permitted: Super Admin, Prosecutor, Lawyer.
 * Denied: Investigator (works on assigned investigation files), Viewer.
 */
export function canCreateCase(user: UserProfile | null): boolean {
  if (!isUserActive(user)) return false;
  return ['super_admin', 'org_admin', 'prosecutor', 'lawyer'].includes(user!.role);
}

/**
 * Checks if user has permission to edit case metadata (title, status, presiding judge).
 * Permitted: Super Admin, or assigned Prosecutor / Lawyer on that case.
 */
export function canEditCase(user: UserProfile | null, legalCase?: LegalCase | null): boolean {
  if (!isUserActive(user)) return false;
  if (['super_admin', 'org_admin'].includes(user!.role)) return true;
  if (!legalCase) return ['prosecutor', 'lawyer'].includes(user!.role);
  return ['prosecutor', 'lawyer'].includes(user!.role) && canUserAccessCase(user, legalCase);
}

/**
 * Checks if user can upload evidence into a case.
 * Permitted: Super Admin, Prosecutor, Lawyer, Investigator (on assigned cases).
 * Explicitly Denied: Viewer / Legal Researcher.
 */
export function canUploadEvidence(user: UserProfile | null, legalCase?: LegalCase | null): boolean {
  if (!isUserActive(user)) return false;
  if (user!.role === 'viewer') return false; // Viewers strictly cannot upload
  if (['super_admin', 'org_admin'].includes(user!.role)) return true;
  if (!legalCase) return ['prosecutor', 'lawyer', 'investigator', 'reviewer'].includes(user!.role);
  return ['prosecutor', 'lawyer', 'investigator', 'reviewer'].includes(user!.role) && canUserAccessCase(user, legalCase);
}

/**
 * Checks if user can delete evidence files.
 * Permitted: Super Admin only.
 */
export function canDeleteEvidence(user: UserProfile | null): boolean {
  if (!isUserActive(user)) return false;
  return user!.role === 'super_admin';
}

/**
 * Checks if user can manage user accounts, assign roles, and activate/deactivate accounts.
 * Permitted: Super Admin and Org Admin.
 */
export function canManageUsers(user: UserProfile | null): boolean {
  if (!isUserActive(user)) return false;
  return ['super_admin', 'org_admin'].includes(user!.role);
}

/**
 * Checks if user can manage system configuration and API credentials.
 * Permitted: Super Admin only.
 */
export function canManageSettings(user: UserProfile | null): boolean {
  if (!isUserActive(user)) return false;
  return user!.role === 'super_admin';
}

/**
 * Checks if user can export official certified chain of custody audit certificates.
 * Permitted: Super Admin, Prosecutor, Lawyer.
 * Denied: Investigator, Viewer.
 */
export function canExportAuditLogs(user: UserProfile | null): boolean {
  if (!isUserActive(user)) return false;
  return ['super_admin', 'org_admin', 'prosecutor', 'lawyer'].includes(user!.role);
}

/**
 * Checks if user can assign or remove officers from a case.
 * Permitted: Super Admin, or case owner / lead counsel.
 */
export function canAssignCaseMembers(user: UserProfile | null, legalCase?: LegalCase | null): boolean {
  if (!isUserActive(user)) return false;
  if (['super_admin', 'org_admin'].includes(user!.role)) return true;
  if (!legalCase) return false;

  const createdByUid = typeof legalCase.createdBy === 'string'
    ? legalCase.createdBy
    : (legalCase.createdBy as any)?.uid;
  const createdByEmail = typeof legalCase.createdBy === 'object' && legalCase.createdBy?.email
    ? legalCase.createdBy.email
    : undefined;

  return (
    createdByUid === user!.uid ||
    (!!createdByEmail && createdByEmail.toLowerCase() === user!.email.toLowerCase())
  );
}

/**
 * Granular Case-Level Access Authorization:
 * Enforces that users can only access cases assigned to them or created by them.
 * Super Admin has institutional oversight over all cases.
 */
export function canUserAccessCase(user: UserProfile | null, legalCase: LegalCase | null): boolean {
  if (!isUserActive(user) || !legalCase) return false;
  
  // Super Admin and Court Admin have global institutional oversight
  if (['super_admin', 'org_admin'].includes(user!.role)) {
    return true;
  }

  // Case creator always has access
  const createdByUid = typeof legalCase.createdBy === 'string'
    ? legalCase.createdBy
    : (legalCase.createdBy as any)?.uid;
  const createdByEmail = typeof legalCase.createdBy === 'object' && legalCase.createdBy?.email
    ? legalCase.createdBy.email
    : undefined;

  if (
    createdByUid === user!.uid ||
    (!!createdByEmail && createdByEmail.toLowerCase() === user!.email.toLowerCase())
  ) {
    return true;
  }

  // Explicit case member assignment
  if (legalCase.members && Array.isArray(legalCase.members)) {
    const isMember = legalCase.members.some(
      (m: any) =>
        m.uid === user!.uid ||
        m.userId === user!.uid ||
        (m.email && m.email.toLowerCase() === user!.email.toLowerCase()) ||
        (m.userEmail && m.userEmail.toLowerCase() === user!.email.toLowerCase())
    );
    if (isMember) return true;
  }

  return false;
}

/**
 * Verifies that a user has authorization to access a specific evidence record
 * by evaluating access to its parent legal case.
 */
export function canUserAccessEvidence(
  user: UserProfile | null,
  legalCase: LegalCase | null,
  evidence: EvidenceFile | null
): boolean {
  if (!isUserActive(user) || !evidence || !legalCase) return false;
  if (evidence.caseId !== legalCase.id) return false;
  return canUserAccessCase(user, legalCase);
}
