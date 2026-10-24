import React, { useState } from 'react';
import { Users, Shield, Plus, CheckCircle2, UserCheck, Building } from 'lucide-react';
import { MOCK_USERS } from '../data/mockEvidence';
import { UserProfile, UserRole } from '../types/auth';
import { useAuth } from '../context/AuthContext';

export const UserManagementPage: React.FC = () => {
  const { role, switchRole } = useAuth();
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
    super_admin: 'bg-purple-900/60 text-purple-300 border-purple-700',
    org_admin: 'bg-blue-900/60 text-blue-300 border-blue-700',
    lawyer: 'bg-amber-900/60 text-amber-300 border-amber-700',
    reviewer: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-slate-100">
              User Access & Permission Management (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforce role-based evidentiary access across High Courts, the Ministry of Justice, and investigative agencies.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Officer</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Authorized User</th>
                <th className="py-3 px-4">Role (RBAC)</th>
                <th className="py-3 px-4">Organization & Division</th>
                <th className="py-3 px-4">Bar # / ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Simulate Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-850/50 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{u.displayName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        roleColors[u.role]
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    <div>{u.organizationName}</div>
                    <div className="text-[10px] text-slate-400">{u.division}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {u.barNumber || 'N/A'}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => switchRole(u.role)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Provision Authorized Officer</span>
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Kwame Asante Esq."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. k.asante@judicial.gov.gh"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="lawyer">Lawyer / Lead Counsel</option>
                  <option value="reviewer">Reviewer / Investigator</option>
                  <option value="org_admin">Organization Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Court Division / Bureau</label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  placeholder="e.g. Commercial Division 2, High Court Accra"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
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
