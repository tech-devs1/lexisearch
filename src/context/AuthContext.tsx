import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { MOCK_USERS } from '../data/mockEvidence';
import { globalAuditService } from '../services/auditService';
import { auth, isLocalMode } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAuthLoading: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, password?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  sendPasswordReset: (email: string) => Promise<void>;
  canEditCase: () => boolean;
  canUploadEvidence: () => boolean;
  canManageUsers: () => boolean;
  canExportAuditLogs: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gleis_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return MOCK_USERS[2]; // Default: Mrs. Abena Osei-Mensah (Lawyer)
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Persist session to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gleis_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gleis_active_user');
    }
  }, [currentUser]);

  // Wire Firebase Auth state observer (non-blocking, mock session takes precedence)
  useEffect(() => {
    if (!auth || isLocalMode) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const matchedMock = MOCK_USERS.find(
          (u) => u.email.toLowerCase() === firebaseUser.email!.toLowerCase()
        );
        if (matchedMock) {
          setCurrentUser(matchedMock);
        }
        // If no mock match, keep the current active session profile
      }
    });
    return () => unsubscribe();
  }, []);

  const switchRole = (newRole: UserRole) => {
    const matchingUser = MOCK_USERS.find((u) => u.role === newRole) || {
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

  const login = async (email: string, password?: string, role?: UserRole): Promise<boolean> => {
    setIsAuthLoading(true);
    try {
      // 1. Try mock user lookup first (by email or role for quick-login buttons)
      const mockMatch =
        MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
        (role ? MOCK_USERS.find((u) => u.role === role) : undefined);

      if (mockMatch) {
        // For one-click role demo buttons: skip Firebase, use mock session
        setCurrentUser(mockMatch);
        globalAuditService.logAction({
          caseId: 'system',
          action: 'CASE_ACCESS',
          actionDescription: `User session started: ${mockMatch.displayName}`,
          userId: mockMatch.uid,
          userEmail: mockMatch.email,
          userRole: mockMatch.role,
        });
        setIsAuthLoading(false);
        return true;
      }

      // 2. Try real Firebase Auth if credentials provided and Firebase available
      if (password && auth && !isLocalMode) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          // Build a minimal GLEIS profile from the Firebase user
          const firebaseProfile: UserProfile = {
            uid: cred.user.uid,
            email: cred.user.email || email,
            displayName: cred.user.displayName || email.split('@')[0],
            role: 'lawyer', // Default role; can be overridden by Firestore profile
            organizationId: 'org_judicial_service',
            organizationName: 'Judicial Service of Ghana',
            division: 'Authenticated User',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            isActive: true,
          };
          setCurrentUser(firebaseProfile);
          globalAuditService.logAction({
            caseId: 'system',
            action: 'CASE_ACCESS',
            actionDescription: `Firebase Auth login: ${firebaseProfile.email}`,
            userId: firebaseProfile.uid,
            userEmail: firebaseProfile.email,
            userRole: firebaseProfile.role,
          });
          setIsAuthLoading(false);
          return true;
        } catch (firebaseErr: any) {
          console.warn('Firebase Auth login failed, trying mock fallback:', firebaseErr.message);
        }
      }

      // 3. Final fallback: any email gets the first mock user (demo mode)
      if (email.includes('@')) {
        const fallbackUser = MOCK_USERS[2]; // Lawyer by default
        setCurrentUser(fallbackUser);
        setIsAuthLoading(false);
        return true;
      }

      setIsAuthLoading(false);
      return false;
    } catch (err) {
      setIsAuthLoading(false);
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = async () => {
    if (currentUser) {
      globalAuditService.logAction({
        caseId: 'system',
        action: 'CASE_ACCESS',
        actionDescription: `User session ended: ${currentUser.displayName}`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
    }
    setCurrentUser(null);
    try {
      if (auth && !isLocalMode) await signOut(auth);
    } catch {
      /* Firebase signOut is best-effort */
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    if (auth && !isLocalMode) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err) {
        console.warn('Password reset email failed (demo mode):', err);
      }
    }
    // In mock/local mode, silently succeed
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
        isAuthLoading,
        switchRole,
        login,
        logout,
        sendPasswordReset,
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
