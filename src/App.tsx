import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { CaseProvider } from './context/CaseContext';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasesPage } from './pages/CasesPage';
import { UnifiedSearchPage } from './pages/UnifiedSearchPage';
import { AudioPlayerPage } from './pages/AudioPlayerPage';
import { DocumentViewerPage } from './pages/DocumentViewerPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { AuditPage } from './pages/AuditPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Root Gate: Shows Public Landing Page to visitors, or AppLayout for authenticated officers
const RootGate: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser || currentUser.isActive === false) {
    return <LandingPage />;
  }
  return <AppLayout />;
};

// Protected Route Guard (enforces active account)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser || currentUser.isActive === false) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Guard (Super Admin & Org Admin only)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canManageUsers } = useAuth();
  if (!canManageUsers()) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};

// Settings Guard (Super Admin only)
const SettingsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canManageSettings } = useAuth();
  if (!canManageSettings()) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <CaseProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Main Application Routes */}
              <Route path="/" element={<RootGate />}>
                <Route index element={<DashboardPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
                <Route path="search" element={<ProtectedRoute><UnifiedSearchPage /></ProtectedRoute>} />
                <Route path="audio" element={<ProtectedRoute><AudioPlayerPage /></ProtectedRoute>} />
                <Route path="document" element={<ProtectedRoute><DocumentViewerPage /></ProtectedRoute>} />
                <Route path="ai-assistant" element={<ProtectedRoute><AiAssistantPage /></ProtectedRoute>} />
                <Route path="bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
                <Route path="audit" element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
                <Route
                  path="users"
                  element={
                    <AdminRoute>
                      <UserManagementPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <SettingsRoute>
                      <SettingsPage />
                    </SettingsRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CaseProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
};

export default App;
