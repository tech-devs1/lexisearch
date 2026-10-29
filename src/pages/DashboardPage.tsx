import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { IndividualLawyerDashboard } from '../components/dashboard/IndividualLawyerDashboard';
import { LawFirmDashboard } from '../components/dashboard/LawFirmDashboard';
import { CourtRegistrarDashboard } from '../components/dashboard/CourtRegistrarDashboard';

/**
 * GLEIS Multi-Persona Dashboard Router
 * Dynamically renders persona-tailored dashboards based on authenticated user credentials:
 * 1. Individual Lawyer / Legal Researcher Dashboard (Personal causes, evidence, audio transcripts, RAG)
 * 2. Law Firm Dashboard (Chambers overview, partner/associate allocation, shared archives)
 * 3. Court Registrar Dashboard (Cause docketing, case assignment & revocation authority, audit records)
 */
export const DashboardPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { activeWorkspace } = useWorkspace();

  // 1. Court Registrar Persona
  // Granted to Court Registrars (org_admin), Super Admins, or members active in Court workspaces
  const isCourtPersona =
    (currentUser?.accountType === 'court' && currentUser?.accountStatus !== 'pending_verification') ||
    role === 'org_admin' ||
    role === 'super_admin' ||
    activeWorkspace?.type === 'court';

  // 2. Law Firm / Chambers Persona
  // Granted to Law Firm accounts or active Organization workspaces
  const isFirmPersona =
    !isCourtPersona &&
    (currentUser?.accountType === 'organization' || activeWorkspace?.type === 'organization');

  // Route to the appropriate dedicated persona dashboard
  if (isCourtPersona) {
    return <CourtRegistrarDashboard />;
  }

  if (isFirmPersona) {
    return <LawFirmDashboard />;
  }

  // 3. Default to Individual Legal Counsel & Research Dashboard
  return <IndividualLawyerDashboard />;
};
