import React, { useState } from 'react';
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  UserCheck,
  Shield,
  ShieldAlert,
  Briefcase,
  Search,
  AlertCircle,
  ChevronRight,
  Trash2,
  Lock,
  Clock,
} from 'lucide-react';
import { UserProfile, UserRole, ROLE_LABELS } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { useCase } from '../context/CaseContext';
import { CaseMember } from '../types/case';

export const UserManagementPage: React.FC = () => {
  const { users, currentUser, updateUserRole, toggleUserStatus, provisionUser } = useAuth();
  const { allCases, assignUserToCase, removeUserFromCase } = useCase();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserForCases, setSelectedUserForCases] = useState<UserProfile | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New User Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('lawyer');
  const [organizationName, setOrganizationName] = useState('Judicial Service of Ghana');
  const [division, setDivision] = useState('');
  const [barNumber, setBarNumber] = useState('');

  // Case Assignment State
  const [assignCaseId, setAssignCaseId] = useState('');
  const [assignCaseRole, setAssignCaseRole] = useState<CaseMember['role']>('counsel');

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) return;

    await provisionUser({
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      role: userRole,
      organizationId: 'org_judicial_service',
      organizationName: organizationName.trim(),
      division: division.trim() || 'Judicial Division',
      barNumber: barNumber.trim() || undefined,
    });

    setIsAddUserOpen(false);
    setDisplayName('');
    setEmail('');
    setUserRole('lawyer');
    setDivision('');
    setBarNumber('');
    showNotification(`Officer profile created for ${displayName.trim()}`);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const success = await updateUserRole(userId, newRole);
    if (success) {
      showNotification(`Role updated to ${ROLE_LABELS[newRole] || newRole}`);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    if (currentUser && currentUser.uid === user.uid) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }
    const newStatus = !user.isActive;
    const success = await toggleUserStatus(user.uid, newStatus);
    if (success) {
      showNotification(
        `Account for ${user.displayName} is now ${newStatus ? 'ACTIVATED' : 'DEACTIVATED'}`
      );
    }
  };

  const handleAssignToCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCases || !assignCaseId) return;

    const success = await assignUserToCase(assignCaseId, selectedUserForCases, assignCaseRole);
    if (success) {
      showNotification(`Assigned to case as ${assignCaseRole.replace('_', ' ')}`);
      setAssignCaseId('');
    }
  };

  const handleRemoveFromCase = async (caseId: string, userId: string) => {
    const success = await removeUserFromCase(caseId, userId);
    if (success) {
      showNotification('Removed user from case');
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.division && u.division.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.barNumber && u.barNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const totalOfficers = users.length;
  const activeOfficers = users.filter((u) => u.isActive !== false).length;
  const deactivatedOfficers = totalOfficers - activeOfficers;

  // Pending registrar verification queue
  const pendingVerificationUsers = users.filter(
    (u) => u.accountStatus === 'pending_verification' && u.isActive !== false
  );

  const handleApproveRegistrar = async (userId: string, userName: string) => {
    const success = await updateUserRole(userId, 'org_admin');
    if (success) {
      showNotification(`Registrar application approved for ${userName}. Role elevated to Court Registrar.`);
    }
  };

  const handleRejectApplication = async (userId: string, userName: string) => {
    const success = await toggleUserStatus(userId, false);
    if (success) {
      showNotification(`Registrar application rejected for ${userName}. Account deactivated.`);
    }
  };

  // Find cases for a specific user
  const getUserAssignedCases = (userId: string) => {
    const target = users.find((u) => u.uid === userId);
    return allCases.filter((c) => {
      const createdByUid = typeof c.createdBy === 'string' ? c.createdBy : (c.createdBy as any)?.uid;
      if (createdByUid === userId) return true;
      return (c.members || []).some(
        (m: any) =>
          m.uid === userId ||
          m.userId === userId ||
          (target && m.email && m.email.toLowerCase() === target.email.toLowerCase())
      );
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
              <Users className="w-3.5 h-3.5" />
            </span>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">
              User Access & Permission Management (RBAC)
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enforce role-based evidentiary access across High Courts, the Ministry of Justice, and investigative agencies.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Provision New Officer</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 bg-gray-900 text-white rounded-lg text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono text-gray-400">Total Officers</div>
          <div className="text-xl font-bold text-gray-900 font-mono mt-1">{totalOfficers}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Enrolled Personnel</div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono text-gray-400">Active Accounts</div>
          <div className="text-xl font-bold text-emerald-600 font-mono mt-1">{activeOfficers}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Authorized for Session</div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono text-gray-400">Deactivated</div>
          <div className="text-xl font-bold text-red-600 font-mono mt-1">{deactivatedOfficers}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Access Revoked</div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono text-gray-400">Total Matters</div>
          <div className="text-xl font-bold text-gray-900 font-mono mt-1">{allCases.length}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Governed Dossiers</div>
        </div>
      </div>

      {/* Pending Registrar Verification Queue */}
      {pendingVerificationUsers.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-md bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
            <div>
              <h2 className="text-xs font-bold text-amber-900">
                Pending Registrar Applications
              </h2>
              <p className="text-[10px] text-amber-700 font-mono mt-0.5">
                {pendingVerificationUsers.length} application{pendingVerificationUsers.length !== 1 ? 's' : ''} awaiting Super Admin verification
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {pendingVerificationUsers.map((u) => (
              <div
                key={u.uid}
                className="bg-white border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-mono text-xs font-bold shrink-0 border border-amber-200">
                    {u.displayName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{u.displayName}</span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-mono shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        Pending
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono truncate">{u.email}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-[10px] text-gray-600">
                        <span className="text-gray-400 font-mono uppercase">Org:</span>{' '}
                        {u.organizationName}
                      </span>
                      {u.division && (
                        <span className="text-[10px] text-gray-600">
                          <span className="text-gray-400 font-mono uppercase">Div:</span>{' '}
                          {u.division}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 font-mono">
                        <span className="text-gray-400 uppercase">Registered:</span>{' '}
                        {new Date(u.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                  <button
                    onClick={() => handleApproveRegistrar(u.uid, u.displayName)}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-[11px] transition shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Approve as Registrar
                  </button>
                  <button
                    onClick={() => handleRejectApplication(u.uid, u.displayName)}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-600 font-medium text-[11px] border border-red-200 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 shadow-xs flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] text-gray-400 font-mono">
            No pending registrar applications
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by officer name, email, division, bar number..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-400 uppercase">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-gray-900 focus:bg-white transition"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="super_admin">Super Admin</option>
            <option value="prosecutor">Prosecutor</option>
            <option value="lawyer">Lawyer / Counsel</option>
            <option value="investigator">Investigator</option>
            <option value="viewer">Viewer / Researcher</option>
            <option value="org_admin">Court Registrar</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200 font-mono">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Authorized Officer</th>
                <th className="py-2.5 px-3 font-semibold">Role (RBAC)</th>
                <th className="py-2.5 px-3 font-semibold">Organization & Division</th>
                <th className="py-2.5 px-3 font-semibold">Case Access</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-mono text-xs">
                    No officer accounts match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const assignedCases = getUserAssignedCases(u.uid);
                  const isCurrentAuthUser = currentUser?.uid === u.uid;

                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-gray-50/70 transition ${
                        u.isActive === false ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center font-mono text-xs shrink-0">
                            {u.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
                              <span>{u.displayName}</span>
                              {isCurrentAuthUser && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 font-mono">
                                  You
                                </span>
                              )}
                              {u.accountStatus === 'pending_verification' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                                  Pending Verification
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="prosecutor">Prosecutor</option>
                          <option value="lawyer">Lawyer / Counsel</option>
                          <option value="investigator">Investigator</option>
                          <option value="viewer">Viewer / Researcher</option>
                          <option value="org_admin">Court Registrar</option>
                        </select>
                      </td>

                      {/* Organization & Division */}
                      <td className="py-3 px-3 text-gray-700">
                        <div className="text-xs font-medium text-gray-900">{u.organizationName}</div>
                        <div className="text-[10px] text-gray-500">{u.division || 'Registry'}</div>
                      </td>

                      {/* Case Access */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedUserForCases(u)}
                          className="px-2.5 py-1 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-mono border border-gray-200 transition flex items-center gap-1"
                        >
                          <Briefcase className="w-3 h-3 text-gray-500" />
                          <span>
                            {u.role === 'super_admin'
                              ? 'All Cases (Global)'
                              : `${assignedCases.length} Assigned`}
                          </span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {u.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-medium font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-[10px] font-medium font-mono">
                            <XCircle className="w-3.5 h-3.5" />
                            DISABLED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrentAuthUser}
                            className={`px-2 py-1 rounded text-xs font-medium border transition ${
                              isCurrentAuthUser
                                ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200'
                                : u.isActive !== false
                                ? 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                                : 'bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}
                            title={
                              isCurrentAuthUser
                                ? 'Cannot deactivate self'
                                : u.isActive !== false
                                ? 'Deactivate Account'
                                : 'Activate Account'
                            }
                          >
                            {u.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Assignments Drawer / Modal */}
      {selectedUserForCases && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-800" />
                  <span>Case-Level Access Authorization</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Officer: <span className="font-semibold text-gray-900">{selectedUserForCases.displayName}</span> ({ROLE_LABELS[selectedUserForCases.role]})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForCases(null)}
                className="text-gray-400 hover:text-gray-700 text-xs font-mono"
              >
                Close ✕
              </button>
            </div>

            {selectedUserForCases.role === 'super_admin' ? (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-1">
                <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-gray-900" />
                  Institutional Super Admin Authority
                </div>
                <p className="text-gray-500">
                  Super Administrators have systemic access to all active and archived legal dockets across all jurisdictions and courts in Ghana. Individual case assignment is optional.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Form to Assign to New Case */}
                <form
                  onSubmit={handleAssignToCase}
                  className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
                >
                  <div className="font-medium text-gray-900 text-xs">Assign Officer to Legal Docket</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-500 text-[10px] uppercase font-mono mb-1">
                        Select Matter
                      </label>
                      <select
                        value={assignCaseId}
                        onChange={(e) => setAssignCaseId(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-gray-900"
                      >
                        <option value="">-- Choose Docket --</option>
                        {allCases.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.caseNumber} - {c.title.slice(0, 30)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-500 text-[10px] uppercase font-mono mb-1">
                        Case Member Role
                      </label>
                      <select
                        value={assignCaseRole}
                        onChange={(e) => setAssignCaseRole(e.target.value as CaseMember['role'])}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-gray-900"
                      >
                        <option value="lead_counsel">Lead Counsel</option>
                        <option value="counsel">Counsel</option>
                        <option value="prosecutor">Prosecutor</option>
                        <option value="investigator">Investigator</option>
                        <option value="viewer">Viewer (Read Only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!assignCaseId}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-medium rounded text-xs transition"
                    >
                      Authorize Case Access
                    </button>
                  </div>
                </form>

                {/* Currently Assigned Cases List */}
                <div>
                  <div className="text-[10px] uppercase font-mono font-medium text-gray-500 mb-2">
                    Authorized Dockets ({getUserAssignedCases(selectedUserForCases.uid).length})
                  </div>
                  {getUserAssignedCases(selectedUserForCases.uid).length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-gray-200 rounded-lg text-gray-400 font-mono">
                      No cases assigned yet. Select a matter above to grant evidentiary access.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {getUserAssignedCases(selectedUserForCases.uid).map((c) => {
                        const memberRecord = (c.members || []).find(
                          (m) => m.uid === selectedUserForCases.uid
                        );
                        const isCreator = (typeof c.createdBy === 'string' ? c.createdBy : c.createdBy?.uid) === selectedUserForCases.uid;

                        return (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-lg border border-gray-200 bg-white flex items-center justify-between"
                          >
                            <div>
                              <div className="font-mono text-xs font-semibold text-gray-900">
                                {c.caseNumber}
                              </div>
                              <div className="text-[11px] text-gray-500 truncate max-w-sm">
                                {c.title}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                {isCreator ? 'Case Originator' : `Role: ${memberRecord?.role || 'member'}`}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveFromCase(c.id, selectedUserForCases.uid)}
                              className="p-1 text-gray-400 hover:text-red-600 transition"
                              title="Revoke Case Authorization"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserForCases(null)}
                className="px-4 py-1.5 rounded-lg bg-gray-900 text-white font-medium text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User / Provision Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-800" />
                <span>Provision Authorized Officer</span>
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Kwame Asante Esq."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Official Court Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. k.asante@judicial.gov.gh"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                    Assigned Role (RBAC)
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  >
                    <option value="lawyer">Lawyer / Counsel</option>
                    <option value="prosecutor">Prosecutor</option>
                    <option value="investigator">Investigator</option>
                    <option value="viewer">Viewer / Researcher</option>
                    <option value="org_admin">Court Registrar</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                    Bar # / Officer ID
                  </label>
                  <input
                    type="text"
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    placeholder="e.g. GAR/1920/2012"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Organization
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Judicial Service of Ghana"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Court Division / Bureau
                </label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="e.g. Commercial Division, High Court Accra"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition shadow-xs"
                >
                  Provision Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
