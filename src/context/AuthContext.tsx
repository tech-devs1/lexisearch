import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { MOCK_USERS } from '../data/mockEvidence';
import { globalAuditService } from '../services/auditService';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  canEditCase: () => boolean;
  canUploadEvidence: () => boolean;
  canManageUsers: () => boolean;
  canExportAuditLogs: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Lead Counsel / Lawyer for realistic workflow
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gleis_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return MOCK_USERS[2]; // Mrs. Abena Osei-Mensah (Lawyer)
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gleis_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gleis_active_user');
    }
  }, [currentUser]);

  const switchRole = (newRole: UserRole) => {
    const matchingUser = MOCK_USERS.find(u => u.role === newRole) || {
      ...currentUser!,
      role: newRole,
    };
    setCurrentUser(matchingUser);

    globalAuditService.logAction({
      caseId: 'system',
      action: 'PERMISSION_CHANGE',
      actionDescription: `Active session role switched to ${newRole.toUpperCase()}`,
      userId: matchingUser.uid,
      userEmail: matchingUser.email,
      userRole: newRole,
    });
  };

  const login = async (email: string, role?: UserRole): Promise<boolean> => {
    const found = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || 
      (role ? MOCK_USERS.find(u => u.role === role) : MOCK_USERS[0]);
    if (found) {
      setCurrentUser(found);
      globalAuditService.logAction({
        caseId: 'system',
        action: 'CASE_ACCESS',
        actionDescription: `User logged in successfully (${found.displayName})`,
        userId: found.uid,
        userEmail: found.email,
        userRole: found.role,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      globalAuditService.logAction({
        caseId: 'system',
        action: 'CASE_ACCESS',
        actionDescription: `User session logged out (${currentUser.displayName})`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }
    setCurrentUser(null);
  };

  // RBAC Permission Gates
  const canEditCase = () => {
    if (!currentUser) return false;
    return ['super_admin', 'org_admin', 'lawyer'].includes(currentUser.role);
  };

  const canUploadEvidence = () => {
    if (!currentUser) return false;
    return ['super_admin', 'org_admin', 'lawyer'].includes(currentUser.role);
  };

  const canManageUsers = () => {
    if (!currentUser) return false;
    return ['super_admin', 'org_admin'].includes(currentUser.role);
  };

  const canExportAuditLogs = () => {
    if (!currentUser) return false;
    return ['super_admin', 'org_admin', 'lawyer'].includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'reviewer',
        switchRole,
        login,
        logout,
        canEditCase,
        canUploadEvidence,
        canManageUsers,
        canExportAuditLogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
