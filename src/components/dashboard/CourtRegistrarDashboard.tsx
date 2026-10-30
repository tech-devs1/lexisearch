import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  Scale,
  Briefcase,
  Users,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  XCircle,
  FileCheck
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, UserRole } from '../../types/auth';
import { CaseMember } from '../../types/case';
import { formatHashTruncated } from '../../services/crypto';

export const CourtRegistrarDashboard: React.FC = () => {
  const { allCases, cases, activeCase, selectCase, createCase, assignUserToCase, removeUserFromCase } = useCase();
  const { currentUser, users } = useAuth();
  const navigate = useNavigate();

  // Modal States
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Assignment Form State
  const [selectedLawyerUid, setSelectedLawyerUid] = useState('');
  const [assignedRole, setAssignedRole] = useState<CaseMember['role']>('counsel');
  const [assignmentNotice, setAssignmentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Case State
  const [caseNumber, setCaseNumber] = useState('');
  const [suitNumber, setSuitNumber] = useState('');
  const [title, setTitle] = useState('');
  const [court, setCourt] = useState('High Court of Justice (Commercial Division 1), Accra');
  const [presidingJudge, setPresidingJudge] = useState('Hon. Justice Sophia Adinyira');
  const [description, setDescription] = useState('');

  // Filter registered legal practitioners for assignment
  const registeredLawyers = users.filter((u) => u.isActive && u.role !== 'super_admin');

  const showNotice = (type: 'success' | 'error', message: string) => {
    setAssignmentNotice({ type, message });
    setTimeout(() => setAssignmentNotice(null), 4000);
  };

  const handleDocketCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim() || !title.trim()) return;

    await createCase({
      caseNumber: caseNumber.trim(),
      suitNumber: suitNumber.trim(),
      title: title.trim(),
      court: court.trim(),
      presidingJudge: presidingJudge.trim(),
      description: description.trim(),
      status: 'in_trial',
    });

    setIsNewCaseOpen(false);
    setCaseNumber('');
    setSuitNumber('');
    setTitle('');
    setDescription('');
    showNotice('success', `Case docket ${caseNumber.trim()} registered in official registry.`);
  };

  const handleAssignCounsel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !selectedLawyerUid) return;

    const targetUser = users.find((u) => u.uid === selectedLawyerUid);
    if (!targetUser) return;

    const success = await assignUserToCase(activeCase.id, targetUser, assignedRole);
    if (success) {
      showNotice(
        'success',
        `Authorized ${targetUser.displayName} (${targetUser.email}) as [${assignedRole.toUpperCase()}] for docket ${activeCase.caseNumber}.`
      );
      setIsAssignModalOpen(false);
      setSelectedLawyerUid('');
    } else {
      showNotice('error', 'Failed to record case assignment. Verify registrar administrative credentials.');
    }
  };

  const handleRevokeCounsel = async (memberUid: string, memberName: string) => {
    if (!activeCase) return;
    const confirmRevoke = window.confirm(
      `Revoke judicial access of ${memberName} from docket ${activeCase.caseNumber}? They will immediately lose access to exhibits, transcripts, and searches.`
    );
    if (!confirmRevoke) return;

    const success = await removeUserFromCase(activeCase.id, memberUid);
    if (success) {
      showNotice('success', `Judicial access revoked for ${memberName}. Docket removed from their active portal.`);
    } else {
      showNotice('error', 'Failed to revoke counsel assignment.');
    }
  };

  // Total exhibits across court registry
  const totalRegistryExhibits = allCases.reduce((acc, c) => acc + (c.evidence?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Court Registry Official Banner */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-semibold flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              <span>Judicial Service of Ghana</span>
            </span>
            <span className="text-xs text-gray-400 font-mono">Registry Administration & Docketing</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 text-white font-medium">
              Court Registrar Authorized
            </span>
          </div>

          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
            Superior Courts Registry & Cause Management
          </h1>

          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            Presiding Officer: <span className="font-semibold text-gray-900">{currentUser?.displayName}</span> (Court Registrar).{' '}
            Administer judicial causes, assign and revoke legal counsel access, manage evidence custody, and certify chain of custody audit ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsNewCaseOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Docket New Cause</span>
          </button>
          <button
            onClick={() => navigate('/audit')}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border border-gray-300 transition flex items-center gap-2 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Registry Audit Log</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {assignmentNotice && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between shadow-xs ${
            assignmentNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {assignmentNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{assignmentNotice.message}</span>
          </div>
          <button onClick={() => setAssignmentNotice(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">REGISTERED CAUSES</span>
            <Briefcase className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{allCases.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">High & Commercial Divisions</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">ENROLLED ADVOCATES</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{registeredLawyers.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Eligible legal counsel</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">EVIDENCE IN CUSTODY</span>
            <FileCheck className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{totalRegistryExhibits}</div>
          <div className="text-[11px] text-gray-500 mt-1">SHA-256 sealed exhibits</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">REGISTRY AUTHORITY</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono">ACTIVE</div>
          <div className="text-[11px] text-gray-500 mt-1">Section 112 NRCD 323 Compliant</div>
        </div>
      </div>

      {/* Main Grid: Cause Catalog + Dedicated Counsel Assignment Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Court Dockets Selector */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold">
              COURT CAUSE DOCKETS ({allCases.length})
            </span>
            <button
              onClick={() => setIsNewCaseOpen(true)}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Docket New</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {allCases.map((c) => {
              const isSelected = activeCase?.id === c.id;
              const assignedCount = c.members?.length || 0;
              return (
                <div
                  key={c.id}
                  onClick={() => selectCase(c.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-gray-900 shadow-sm ring-1 ring-gray-900'
                      : 'bg-white border-gray-200 hover:border-gray-400 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {c.caseNumber}
                      </span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">{c.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{c.court}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-mono">
                      {assignedCount} counsel assigned
                    </span>
                    <span className={isSelected ? 'font-bold text-gray-900' : 'text-gray-400'}>
                      {isSelected ? '● Managing' : 'Click to manage'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Court Registrar Case Administration & Counsel Assignment Engine */}
        <div className="lg:col-span-2 space-y-4">
          {activeCase ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 shadow-xs">
              {/* Docket Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {activeCase.caseNumber}
                    </span>
                    {activeCase.suitNumber && (
                      <span className="text-xs font-mono text-gray-500">Suit: {activeCase.suitNumber}</span>
                    )}
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-600 font-mono">
                      Presiding: {activeCase.presidingJudge || 'Hon. Justice'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mt-1">{activeCase.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{activeCase.court}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign Legal Counsel</span>
                  </button>
                  <button
                    onClick={() => navigate('/cases')}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border border-gray-300 transition flex items-center gap-1"
                  >
                    <span>View Exhibits</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Case Participant Roster Table (Core Requirement 3) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-700" />
                    <span className="text-xs font-bold text-gray-900 uppercase font-mono tracking-wider">
                      ASSIGNED LEGAL COUNSEL & PROSECUTORS ({activeCase.members?.length || 0})
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Registrar Case-Level Authorization
                  </span>
                </div>

                {(!activeCase.members || activeCase.members.length === 0) ? (
                  <div className="p-8 text-center border border-dashed border-gray-300 rounded-xl space-y-2">
                    <Users className="w-8 h-8 text-gray-400 mx-auto" />
                    <div className="text-xs font-semibold text-gray-900">No Counsel Assigned to this Docket</div>
                    <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                      This court cause is currently sealed from external view. Click "Assign Legal Counsel" to grant authorized counsel access to review transcripts and file exhibits.
                    </p>
                    <button
                      onClick={() => setIsAssignModalOpen(true)}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition shadow-xs"
                    >
                      Assign Counsel Now
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider text-[10px] font-mono border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Assigned Counsel</th>
                          <th className="py-2.5 px-3 font-semibold">Designated Role</th>
                          <th className="py-2.5 px-3 font-semibold">Assigned Date</th>
                          <th className="py-2.5 px-3 font-semibold">Access Status</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Judicial Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeCase.members.map((member) => (
                          <tr key={member.uid} className="hover:bg-gray-50/70 transition">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-gray-900">{member.displayName}</div>
                              <div className="text-[11px] text-gray-500 font-mono">{member.email}</div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200 uppercase font-semibold">
                                {member.role.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-mono text-[11px] text-gray-500">
                              {new Date(member.assignedAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>

                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Authorized</span>
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleRevokeCounsel(member.uid, member.displayName)}
                                className="px-2.5 py-1 rounded-md bg-white hover:bg-red-600 hover:text-white text-red-600 font-medium text-xs border border-red-200 hover:border-red-600 transition shadow-xs flex items-center gap-1 ml-auto"
                                title="Revoke case assignment immediately"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Revoke Access</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Case Exhibits in Registry Custody */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-gray-900 uppercase font-mono tracking-wider">
                    EVIDENTIARY EXHIBITS IN REGISTRY CUSTODY ({activeCase.evidence?.length || 0})
                  </span>
                  <button
                    onClick={() => navigate('/cases')}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                  >
                    <span>Manage Exhibits</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {(!activeCase.evidence || activeCase.evidence.length === 0) ? (
                  <div className="py-4 text-center text-xs text-gray-400 font-mono">
                    No exhibits filed in this docket registry yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeCase.evidence.slice(0, 4).map((ev) => (
                      <div key={ev.id} className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 line-clamp-1">{ev.fileName}</span>
                          <span className="text-[10px] font-mono uppercase text-gray-500">{ev.fileType}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>SHA: {formatHashTruncated(ev.sha256Hash, 8)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-gray-200 rounded-xl space-y-2 shadow-xs">
              <Landmark className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-sm font-semibold text-gray-900">No Court Cause Selected</div>
              <p className="text-xs text-gray-500">
                Select a court docket from the list on the left to assign counsel or review exhibits.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Counsel Modal (Requirement 3) */}
      {isAssignModalOpen && activeCase && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAssignModalOpen(false); }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900">
                  <UserPlus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Assign Legal Counsel to Docket</h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Docket: {activeCase.caseNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAssignCounsel} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Select Registered Legal Practitioner *
                </label>
                <select
                  required
                  value={selectedLawyerUid}
                  onChange={(e) => setSelectedLawyerUid(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">-- Choose Counsel from Ghana Registry --</option>
                  {registeredLawyers.map((l) => (
                    <option key={l.uid} value={l.uid}>
                      {l.displayName} ({l.email}) {l.barNumber ? `— Bar #${l.barNumber}` : ''} [{l.role.toUpperCase()}]
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  Only enrolled and verified legal practitioners with active accounts can be assigned.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Assigned Case Role *
                </label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value as CaseMember['role'])}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="lead_counsel">Lead Defense Counsel</option>
                  <option value="counsel">Associate Defense Counsel</option>
                  <option value="prosecutor">State Prosecutor / Attorney-General</option>
                  <option value="investigator">Investigator / CID Officer</option>
                  <option value="viewer">Judicial Researcher / Viewer (Read-Only)</option>
                </select>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-900">Judicial Effect:</span> This assignment grants immediate access to this specific docket's verbatim recordings, document exhibits, and AI cross-examination. Revoking assignment revokes all access instantly.
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedLawyerUid}
                  className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs shadow-xs disabled:opacity-40"
                >
                  Authorize Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Docket New Cause Modal */}
      {isNewCaseOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsNewCaseOpen(false); }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-gray-800" />
                <span>Docket Official Court Cause</span>
              </h3>
              <button
                onClick={() => setIsNewCaseOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleDocketCaseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Official Suit / Docket Number *
                </label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. CR/ACC/0512/2026"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Cause Title (Parties) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Republic v. Kwesi Appiah & Anor"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Court Division
                </label>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  placeholder="e.g. High Court (Criminal Division 2), Accra"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Presiding Judge
                </label>
                <input
                  type="text"
                  value={presidingJudge}
                  onChange={(e) => setPresidingJudge(e.target.value)}
                  placeholder="e.g. Hon. Justice Sophia Adinyira"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Cause Summary & Indictment Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Official charges, witness testimony summary, preliminary objections..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCaseOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs shadow-xs"
                >
                  Docket Cause
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
