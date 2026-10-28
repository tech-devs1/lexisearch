import React, { useState } from 'react';
import { Users, Plus, CheckCircle2, UserCheck } from 'lucide-react';
import { MOCK_USERS } from '../data/mockEvidence';
import { UserProfile, UserRole } from '../types/auth';
import { useAuth } from '../context/AuthContext';

export const UserManagementPage: React.FC = () => {
  const { switchRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('lawyer');
  const [division, setDivision] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) return;

    const newUser: UserProfile = {
      uid: `user_${Date.now()}`,
      email: email.trim(),
      displayName: displayName.trim(),
      role: userRole,
      organizationId: 'org_judicial_service',
      organizationName: 'Judicial Service of Ghana',
      division: division || 'High Court Division',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
    };

    setUsers([...users, newUser]);
    setIsAddUserOpen(false);
    setEmail('');
    setDisplayName('');
    setDivision('');
  };

  const roleColors: Record<UserRole, string> = {
    super_admin: 'bg-gray-100 text-gray-900 border-gray-300',
    org_admin: 'bg-gray-100 text-gray-900 border-gray-300',
    lawyer: 'bg-gray-100 text-gray-900 border-gray-300',
    reviewer: 'bg-gray-100 text-gray-900 border-gray-300',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200 font-mono">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Authorized User</th>
                <th className="py-2.5 px-3 font-semibold">Role (RBAC)</th>
                <th className="py-2.5 px-3 font-semibold">Organization & Division</th>
                <th className="py-2.5 px-3 font-semibold">Bar # / ID</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 text-right font-semibold">Simulate Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50/70 transition">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-gray-900 text-xs">{u.displayName}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{u.email}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                        roleColors[u.role]
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-gray-700">
                    <div className="text-xs font-medium text-gray-900">{u.organizationName}</div>
                    <div className="text-[10px] text-gray-500">{u.division}</div>
                  </td>

                  <td className="py-3 px-3 font-mono text-gray-500 text-xs">
                    {u.barNumber || 'N/A'}
                  </td>

                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => switchRole(u.role)}
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-medium border border-gray-200 hover:border-gray-900 transition shadow-xs"
                    >
                      Switch to Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
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
                className="text-gray-400 hover:text-gray-700 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">Full Legal Name</label>
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
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">Official Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. k.asante@judicial.gov.gh"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">Assigned Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="lawyer">Lawyer / Lead Counsel</option>
                  <option value="reviewer">Reviewer / Investigator</option>
                  <option value="org_admin">Organization Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">Court Division / Bureau</label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="e.g. Commercial Division 2, High Court Accra"
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
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
