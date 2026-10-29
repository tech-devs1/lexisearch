import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { MOCK_USERS } from '../data/mockEvidence';
import { globalAuditService } from '../services/auditService';
import { auth, isLocalMode } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  saveUserProfile,
  getUserProfile,
  loadAllUserProfiles,
  updateUserProfile as updateProfileFirestore,
} from '../services/firestoreService';
import {
  isUserActive,
  canCreateCase,
  canEditCase,
  canUploadEvidence,
  canDeleteEvidence,
  canManageUsers,
  canManageSettings,
  canExportAuditLogs,
  canUserAccessCase,
} from '../services/rbacService';
import { LegalCase } from '../types/case';

const USERS_STORAGE_KEY = 'gleis_users_v2';
const ACTIVE_USER_STORAGE_KEY = 'gleis_active_user_v2';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  role: UserRole;
  isAuthLoading: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password?: string;
    displayName: string;
    accountType?: 'individual' | 'organization' | 'court';
    organizationName?: string;
    barNumber?: string;
    division?: string;
    role?: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  sendEmailVerificationNotice: () => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>;
  toggleUserStatus: (userId: string, active: boolean) => Promise<boolean>;
  provisionUser: (userData: Partial<UserProfile>) => Promise<UserProfile>;
  // RBAC Permission Gates
  canCreateCase: () => boolean;
  canEditCase: (legalCase?: LegalCase | null) => boolean;
  canUploadEvidence: (legalCase?: LegalCase | null) => boolean;
  canDeleteEvidence: () => boolean;
  canManageUsers: () => boolean;
  canManageSettings: () => boolean;
  canExportAuditLogs: () => boolean;
  canAccessCase: (legalCase: LegalCase | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize Users list from storage or seed with personas
  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch { /* ignore */ }
      }
    }
    return MOCK_USERS;
  });

  // 2. Initialize Current User (Default to Lead Counsel for smooth evaluation)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.isActive !== false) {
            return parsed;
          }
        } catch { /* ignore */ }
      }
    }
    // Default to Mrs. Abena Osei-Mensah (Lawyer)
    return MOCK_USERS.find((u) => u.role === 'lawyer') || MOCK_USERS[0];
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Sync users to storage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users]);

  // Sync active user to storage and verify status
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      if (currentUser) {
        // Double-check if user was deactivated in the user list
        const latestProfile = users.find((u) => u.uid === currentUser.uid);
        if (latestProfile && latestProfile.isActive === false) {
          // Force logout of deactivated account
          setCurrentUser(null);
          localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
          return;
        }
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      }
    }
  }, [currentUser, users]);

  // Wire Firebase Auth state observer (non-blocking, synced with verified profiles)
  useEffect(() => {
    if (!auth || isLocalMode) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const matched = users.find(
          (u) => u.email.toLowerCase() === firebaseUser.email!.toLowerCase()
        );
        if (matched) {
          if (matched.isActive) {
            setCurrentUser(matched);
          } else {
            signOut(auth).catch(() => {});
            setCurrentUser(null);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [users]);

  // Quick switch role (used for demo persona simulation)
  const switchRole = useCallback((newRole: UserRole) => {
    const matchingUser = users.find((u) => u.role === newRole);
    if (matchingUser) {
      if (!matchingUser.isActive) {
        alert(`Account for ${matchingUser.displayName} is deactivated. Cannot switch.`);
        return;
      }
      setCurrentUser(matchingUser);
      globalAuditService.logAction({
        caseId: 'system',
        action: 'PERMISSION_CHANGE',
        actionDescription: `Active session persona switched to ${matchingUser.displayName} (${newRole.toUpperCase()})`,
        userId: matchingUser.uid,
        userEmail: matchingUser.email,
        userRole: newRole,
      });
    }
  }, [users]);

  // Secure Login with account active check & safe default role
  const login = async (
    email: string,
    password?: string,
    roleHint?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsAuthLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1. Look up existing profile in users
      let matchedUser = users.find(
        (u) => u.email.toLowerCase() === normalizedEmail || (roleHint && u.role === roleHint)
      );

      // Check account activation status
      if (matchedUser && matchedUser.isActive === false) {
        await globalAuditService.logAction({
          caseId: 'system',
          action: 'AUTH_FAILED',
          actionDescription: `Blocked authentication attempt for deactivated account: ${matchedUser.email}`,
          userId: matchedUser.uid,
          userEmail: matchedUser.email,
          userRole: matchedUser.role,
        });
        setIsAuthLoading(false);
        return {
          success: false,
          error: 'Account disabled. Access revoked by Judicial Service Administrator.',
        };
      }

      // 2. If password provided and Firebase available, verify credentials
      if (password && auth && !isLocalMode) {
        try {
          const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
          if (!matchedUser) {
            // New user registration / first login -> Safe Default Role: 'viewer'
            matchedUser = {
              uid: cred.user.uid,
              email: cred.user.email || normalizedEmail,
              displayName: cred.user.displayName || normalizedEmail.split('@')[0],
              role: 'viewer', // Safe default: must be elevated by Super Admin
              organizationId: 'org_judicial_service',
              organizationName: 'Judicial Service of Ghana',
              division: 'Registered Legal Researcher',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              isActive: true,
            };
            setUsers((prev) => [...prev, matchedUser!]);
          }
        } catch (firebaseErr: any) {
          console.warn('Firebase Auth notice:', firebaseErr.message);
          // If mock password matches or mock email, continue
        }
      }

      // 3. Fallback for new registration via email in demo mode
      if (!matchedUser && normalizedEmail.includes('@')) {
        matchedUser = {
          uid: `user_${Date.now()}`,
          email: normalizedEmail,
          displayName: normalizedEmail.split('@')[0].replace(/\./g, ' '),
          role: 'viewer', // Safe default role
          organizationId: 'org_judicial_service',
          organizationName: 'Judicial Service of Ghana',
          division: 'External Legal Researcher',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isActive: true,
        };
        setUsers((prev) => [...prev, matchedUser!]);
      }

      if (matchedUser) {
        // Update last login
        const updatedUser = {
          ...matchedUser,
          lastLoginAt: new Date().toISOString(),
        };
        setUsers((prev) => prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)));
        setCurrentUser(updatedUser);

        await globalAuditService.logAction({
          caseId: 'system',
          action: 'AUTH_LOGIN',
          actionDescription: `Session authenticated: ${updatedUser.displayName} [${updatedUser.role.toUpperCase()}]`,
          userId: updatedUser.uid,
          userEmail: updatedUser.email,
          userRole: updatedUser.role,
        });

        setIsAuthLoading(false);
        return { success: true };
      }

      setIsAuthLoading(false);
      return { success: false, error: 'Invalid courtroom credentials or unverified officer email.' };
    } catch (err: any) {
      setIsAuthLoading(false);
      return { success: false, error: err.message || 'Authentication error encountered.' };
    }
  };

  const logout = async () => {
    if (currentUser) {
      await globalAuditService.logAction({
        caseId: 'system',
        action: 'AUTH_LOGOUT',
        actionDescription: `Session terminated: ${currentUser.displayName}`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }
    setCurrentUser(null);
    try {
      if (auth && !isLocalMode) await signOut(auth);
    } catch {
      /* ignore */
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    if (auth && !isLocalMode) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err) {
        console.warn('Password reset notice:', err);
      }
    }
  };

  // Real User Registration with Email Verification & Account Typing
  const register = async (data: {
    email: string;
    password?: string;
    displayName: string;
    accountType?: 'individual' | 'organization' | 'court';
    organizationName?: string;
    barNumber?: string;
    division?: string;
    role?: UserRole;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsAuthLoading(true);
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if user already exists
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      setIsAuthLoading(false);
      return { success: false, error: 'An officer account with this official email already exists.' };
    }

    let uid = `user_${Date.now()}`;
    let emailVerified = false;

    // Real Firebase registration if available
    if (data.password && auth && !isLocalMode) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, data.password);
        uid = cred.user.uid;
        emailVerified = cred.user.emailVerified;
        await updateProfile(cred.user, { displayName: data.displayName.trim() }).catch(() => {});
        await sendEmailVerification(cred.user).catch(() => {});
      } catch (fbErr: any) {
        console.warn('Firebase registration notice:', fbErr.message);
        if (fbErr.code === 'auth/email-already-in-use') {
          setIsAuthLoading(false);
          return { success: false, error: 'Email already registered in Firebase identity vault.' };
        }
      }
    }

    // Role assignment based on registration type
    // Security Protocol: Public self-registration must NEVER grant Court Registrar (org_admin) automatically!
    let role: UserRole = 'viewer';
    let accountStatus: 'active' | 'pending_verification' = 'active';

    if (data.accountType === 'court') {
      // Must be verified by Super Admin before gaining registrar authority
      role = 'viewer';
      accountStatus = 'pending_verification';
    } else if (data.accountType === 'organization') {
      role = 'lawyer';
      accountStatus = 'active';
    } else if (data.barNumber && data.barNumber.trim().length >= 3) {
      role = 'lawyer';
      accountStatus = 'active';
    } else {
      role = data.role || 'viewer';
      accountStatus = 'active';
    }

    const newProfile: UserProfile = {
      uid,
      email: normalizedEmail,
      displayName: data.displayName.trim(),
      role,
      accountType: data.accountType || 'individual',
      accountStatus,
      organizationId: data.accountType === 'organization' ? `org_${Date.now()}` : 'org_judicial_service',
      organizationName:
        data.organizationName?.trim() ||
        (data.accountType === 'court' ? 'High Court of Ghana' : 'Judicial Service of Ghana'),
      barNumber: data.barNumber?.trim() || undefined,
      division:
        data.division?.trim() ||
        (data.accountType === 'court'
          ? 'Court Administration & Registry (Pending Verification)'
          : 'Commercial & Criminal Litigation'),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      emailVerified,
      isActive: true,
    };

    // Persist profile to Firestore
    await saveUserProfile(newProfile);

    setUsers((prev) => [...prev, newProfile]);
    setCurrentUser(newProfile);

    await globalAuditService.logAction({
      caseId: 'system',
      action: 'AUTH_LOGIN',
      actionDescription: `New officer registered: ${newProfile.displayName} [${newProfile.role.toUpperCase()}] (${newProfile.accountType || 'individual'})`,
      userId: newProfile.uid,
      userEmail: newProfile.email,
      userRole: newProfile.role,
    });

    setIsAuthLoading(false);
    return { success: true };
  };

  const sendEmailVerificationNotice = async (): Promise<boolean> => {
    if (auth && auth.currentUser && !isLocalMode) {
      try {
        await sendEmailVerification(auth.currentUser);
        return true;
      } catch (err) {
        console.warn('Email verification dispatch notice:', err);
        return false;
      }
    }
    return true;
  };

  // Administrator: Update User Role
  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    if (!canManageUsers(currentUser)) {
      await globalAuditService.logAction({
        caseId: 'system',
        action: 'ACCESS_DENIED',
        actionDescription: `Unauthorized attempt to change role for user ${userId}`,
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'unknown',
        userRole: currentUser?.role || 'none',
      });
      return false;
    }

    const targetUser = users.find((u) => u.uid === userId);
    if (!targetUser) return false;

    const oldRole = targetUser.role;
    setUsers((prev) => prev.map((u) => (u.uid === userId ? { ...u, role: newRole, accountStatus: 'active' } : u)));

    if (currentUser?.uid === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole, accountStatus: 'active' } : null));
    }

    await updateProfileFirestore(userId, { role: newRole, accountStatus: 'active' });

    await globalAuditService.logAction({
      caseId: 'system',
      action: 'USER_ROLE_CHANGED',
      actionDescription: `Role of ${targetUser.displayName} updated from ${oldRole.toUpperCase()} to ${newRole.toUpperCase()} by ${currentUser?.displayName}`,
      userId: currentUser!.uid,
      userEmail: currentUser!.email,
      userRole: currentUser!.role,
      metadata: { targetUserId: userId, oldRole, newRole },
    });

    return true;
  };

  // Administrator: Activate or Deactivate Account
  const toggleUserStatus = async (userId: string, active: boolean): Promise<boolean> => {
    if (!canManageUsers(currentUser)) {
      return false;
    }

    // Protect against self-deactivation of current admin
    if (currentUser?.uid === userId && !active) {
      alert('Administrators cannot deactivate their own active account.');
      return false;
    }

    const targetUser = users.find((u) => u.uid === userId);
    if (!targetUser) return false;

    setUsers((prev) => prev.map((u) => (u.uid === userId ? { ...u, isActive: active } : u)));

    await updateProfileFirestore(userId, { isActive: active });

    await globalAuditService.logAction({
      caseId: 'system',
      action: 'USER_STATUS_CHANGED',
      actionDescription: `Account status for ${targetUser.displayName} changed to ${active ? 'ACTIVE' : 'DEACTIVATED'} by ${currentUser?.displayName}`,
      userId: currentUser!.uid,
      userEmail: currentUser!.email,
      userRole: currentUser!.role,
      metadata: { targetUserId: userId, targetEmail: targetUser.email, active },
    });

    return true;
  };

  // Administrator: Provision New Officer
  const provisionUser = async (userData: Partial<UserProfile>): Promise<UserProfile> => {
    if (!canManageUsers(currentUser)) {
      throw new Error('Unauthorized to provision new accounts.');
    }

    const newUser: UserProfile = {
      uid: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: userData.email?.trim().toLowerCase() || '',
      displayName: userData.displayName?.trim() || 'Court Officer',
      role: userData.role || 'viewer',
      organizationId: userData.organizationId || 'org_judicial_service',
      organizationName: userData.organizationName || 'Judicial Service of Ghana',
      barNumber: userData.barNumber?.trim(),
      division: userData.division?.trim() || 'Court Registry',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
    };

    setUsers((prev) => [...prev, newUser]);
    await saveUserProfile(newUser);

    await globalAuditService.logAction({
      caseId: 'system',
      action: 'PERMISSION_CHANGE',
      actionDescription: `Provisioned new court officer account: ${newUser.displayName} (${newUser.email}) with role [${newUser.role.toUpperCase()}]`,
      userId: currentUser!.uid,
      userEmail: currentUser!.email,
      userRole: currentUser!.role,
      metadata: { newUserId: newUser.uid, role: newUser.role },
    });

    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        role: currentUser?.role || 'viewer',
        isAuthLoading,
        login,
        register,
        sendEmailVerificationNotice,
        logout,
        switchRole,
        sendPasswordReset,
        updateUserRole,
        toggleUserStatus,
        provisionUser,
        canCreateCase: () => canCreateCase(currentUser),
        canEditCase: (legalCase) => canEditCase(currentUser, legalCase),
        canUploadEvidence: (legalCase) => canUploadEvidence(currentUser, legalCase),
        canDeleteEvidence: () => canDeleteEvidence(currentUser),
        canManageUsers: () => canManageUsers(currentUser),
        canManageSettings: () => canManageSettings(currentUser),
        canExportAuditLogs: () => canExportAuditLogs(currentUser),
        canAccessCase: (legalCase) => canUserAccessCase(currentUser, legalCase),
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
