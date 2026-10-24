import { describe, it, expect } from 'vitest';
import { UserRole } from '../types/auth';

describe('Role-Based Access Control (RBAC) Specification', () => {
  const checkPermission = (role: UserRole, action: 'edit_case' | 'upload_evidence' | 'manage_users' | 'export_audit') => {
    switch (action) {
      case 'edit_case':
      case 'upload_evidence':
        return ['super_admin', 'org_admin', 'lawyer'].includes(role);
      case 'manage_users':
        return ['super_admin', 'org_admin'].includes(role);
      case 'export_audit':
        return ['super_admin', 'org_admin', 'lawyer'].includes(role);
      default:
        return false;
    }
  };

  it('Super Admin should have all permissions', () => {
    expect(checkPermission('super_admin', 'edit_case')).toBe(true);
    expect(checkPermission('super_admin', 'upload_evidence')).toBe(true);
    expect(checkPermission('super_admin', 'manage_users')).toBe(true);
    expect(checkPermission('super_admin', 'export_audit')).toBe(true);
  });

  it('Lawyer / Lead Counsel should be able to edit case and upload evidence, but not manage users', () => {
    expect(checkPermission('lawyer', 'edit_case')).toBe(true);
    expect(checkPermission('lawyer', 'upload_evidence')).toBe(true);
    expect(checkPermission('lawyer', 'manage_users')).toBe(false);
  });

  it('Reviewer / Investigator should have read-only access and cannot edit case or manage users', () => {
    expect(checkPermission('reviewer', 'edit_case')).toBe(false);
    expect(checkPermission('reviewer', 'upload_evidence')).toBe(false);
    expect(checkPermission('reviewer', 'manage_users')).toBe(false);
    expect(checkPermission('reviewer', 'export_audit')).toBe(false);
  });
});
