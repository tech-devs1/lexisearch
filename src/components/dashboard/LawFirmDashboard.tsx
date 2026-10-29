import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Briefcase,
  FileText,
  Headphones,
  Search,
  ShieldCheck,
  Plus,
  ArrowRight,
  UserPlus,
  Scale,
  FolderLock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatHashTruncated } from '../../services/crypto';
import { EvidenceUploadModal } from '../cases/EvidenceUploadModal';

export const LawFirmDashboard: React.FC = () => {
  const { cases, activeCase, selectCase, createCase, evidenceList } = useCase();
  const { currentUser, users } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // New Case form state
  const [caseNumber, setCaseNumber] = useState('');
  const [title, setTitle] = useState('');
  const [court, setCourt] = useState('High Court (Commercial Division), Accra');
  const [presidingJudge, setPresidingJudge] = useState('');
  const [description, setDescription] = useState('');

  const firmName = currentUser?.organizationName || activeWorkspace?.name || 'Legal Chambers & Partners';

  // Find lawyers associated with this firm
  const firmMembers = users.filter(
    (u) =>
      u.organizationId === currentUser?.organizationId ||
      u.organizationName === currentUser?.organizationName ||
      u.role === 'lawyer'
  );

  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim() || !title.trim()) return;

    await createCase({
      caseNumber: caseNumber.trim(),
      title: title.trim(),
      court: court.trim(),
      presidingJudge: presidingJudge.trim(),
      description: description.trim(),
      status: 'in_trial',
      workspaceId: activeWorkspace?.id,
    });

    setIsNewCaseOpen(false);
    setCaseNumber('');
    setTitle('');
    setDescription('');
    setPresidingJudge('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Law Firm / Chambers Banner */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>Chambers & Law Practice</span>
            </span>
            <span className="text-xs text-gray-400 font-mono">Firm Dossier Hub</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 text-white font-medium">
              Managing Counsel Portal
            </span>
          </div>

          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
            {firmName}
          </h1>

          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            Coordinated defense litigation, chambers dockets, associate task allocation, and cryptographic evidence custody for all active firm representations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsNewCaseOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Firm Docket</span>
          </button>
          <button
            onClick={() => navigate('/search')}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border border-gray-300 transition flex items-center gap-2 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Firm Archives</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">ACTIVE FIRM DOCKETS</span>
            <Briefcase className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{cases.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Under firm representation</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">FIRM ADVOCATES</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{firmMembers.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Partners & Counsel on roster</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">SHARED EVIDENCE VAULT</span>
            <FolderLock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{evidenceList.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Exhibits & depositions</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">CHAIN OF CUSTODY</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono">100%</div>
          <div className="text-[11px] text-gray-500 mt-1">Tamper-evident ledger</div>
        </div>
      </div>

      {/* Main Grid: Firm Dockets + Firm Team Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Firm Dockets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold">
              CHAMBERS CAUSE LIST & ACTIVE DOCKETS ({cases.length})
            </span>
            <button
              onClick={() => setIsNewCaseOpen(true)}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Create Docket</span>
            </button>
          </div>

          {cases.length === 0 ? (
            <div className="p-8 text-center bg-white border border-gray-200 rounded-xl space-y-2 shadow-xs">
              <Briefcase className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-xs font-semibold text-gray-900">No firm cases registered</div>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                File a new litigation or commercial case to begin managing firm exhibits, assign associate counsel, and coordinate trial defense.
              </p>
              <button
                onClick={() => setIsNewCaseOpen(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition"
              >
                File First Case
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cases.map((c) => {
                const isSelected = activeCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectCase(c.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-gray-900 shadow-sm ring-1 ring-gray-900'
                        : 'bg-white border-gray-200 hover:border-gray-400 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {c.caseNumber}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{c.title}</h3>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{c.description || 'No case brief recorded.'}</p>
                      <div className="text-[10px] text-gray-400 mt-2 font-mono">{c.court}</div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{c.evidence?.length || 0} exhibits attached</span>
                      <span className={isSelected ? 'font-semibold text-gray-900' : 'text-gray-400'}>
                        {isSelected ? '● Selected' : 'Click to select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Docket Evidence Preview */}
          {activeCase && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                    SELECTED FIRM MATTER
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-0.5">{activeCase.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ingest Exhibit</span>
                  </button>
                  <button
                    onClick={() => navigate('/cases')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition"
                  >
                    Manage
                  </button>
                </div>
              </div>

              {evidenceList.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500 font-mono">
                  No evidence files attached yet. Click "Ingest Exhibit" to add recordings or documents.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {evidenceList.slice(0, 4).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        if (ev.fileType === 'audio') navigate(`/audio?id=${ev.id}`);
                        else navigate(`/document?id=${ev.id}`);
                      }}
                      className="p-3 rounded-lg bg-gray-50 hover:bg-white border border-gray-200 cursor-pointer transition text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-mono font-semibold text-gray-700">
                            {ev.fileType}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-mono">Sealed</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 line-clamp-1">{ev.fileName}</h4>
                        <div className="text-[10px] text-gray-500 font-mono mt-1">
                          SHA: {formatHashTruncated(ev.sha256Hash, 8)}
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-600 font-medium">
                        <span>{ev.fileType === 'audio' ? 'Play Recording' : 'Read Exhibit'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Firm Roster & Associate Allocation */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Firm Legal Team</h3>
                  <p className="text-[10px] text-gray-500">{firmMembers.length} enrolled legal officers</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {firmMembers.slice(0, 6).map((m) => (
                <div key={m.uid} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-gray-900 line-clamp-1">{m.displayName}</div>
                    <div className="text-[10px] text-gray-500">{m.email}</div>
                    {m.barNumber && (
                      <span className="inline-block mt-0.5 text-[9px] font-mono text-gray-600 bg-gray-200/70 px-1 py-0.2 rounded">
                        Bar: {m.barNumber}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 capitalize font-medium shrink-0">
                    {m.role.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chambers Quick AI Inquiry */}
          <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Chambers Grounded AI</h3>
                <p className="text-[10px] text-gray-500">Cross-docket legal evidence synthesis</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Synthesize testimonies and affidavits across your firm's docket archives with verifiable citations.
            </p>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="w-full py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition"
            >
              Launch Chambers Q&A
            </button>
          </div>
        </div>
      </div>

      {/* New Case Modal */}
      {isNewCaseOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-800" />
                <span>File New Chambers Docket</span>
              </h3>
              <button
                onClick={() => setIsNewCaseOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Suit / Case Number *
                </label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. FTC/COMM/014/2026"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Case Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Apex Minerals Ltd v. Standard Logistics Corp"
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
                  placeholder="e.g. High Court (Commercial Division 1), Accra"
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
                  Matter Brief / Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of claims, breach of contract allegations, key evidence..."
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
                  Docket Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Evidence Modal */}
      <EvidenceUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        caseId={activeCase?.id}
      />
    </div>
  );
};
