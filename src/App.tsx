import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import { AppLayout } from './components/layout/AppLayout';

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
      <CaseProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="cases" element={<CasesPage />} />
              <Route path="search" element={<UnifiedSearchPage />} />
              <Route path="audio" element={<AudioPlayerPage />} />
              <Route path="document" element={<DocumentViewerPage />} />
              <Route path="ai-assistant" element={<AiAssistantPage />} />
              <Route path="bookmarks" element={<BookmarksPage />} />
              <Route path="audit" element={<AuditPage />} />
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
    </AuthProvider>
  );
};

export default App;
