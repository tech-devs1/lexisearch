import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Upload, 
  Headphones, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { EvidenceUploadModal } from '../components/cases/EvidenceUploadModal';
import { formatHashTruncated } from '../services/crypto';
import { EvidenceStatus } from '../types/evidence';

export const CasesPage: React.FC = () => {
  const { cases, activeCase, selectCase, createCase } = useCase();
  const { canEditCase, canUploadEvidence } = useAuth();
  const navigate = useNavigate();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);

  // New Case form state
  const [caseNumber, setCaseNumber] = useState('');
  const [suitNumber, setSuitNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [court, setCourt] = useState('High Court of Justice, Accra');
  const [presidingJudge, setPresidingJudge] = useState('');

  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim() || !title.trim()) return;

    await createCase({
      caseNumber: caseNumber.trim(),
      suitNumber: suitNumber.trim(),
      title: title.trim(),
      description: description.trim(),
      court: court.trim(),
      presidingJudge: presidingJudge.trim(),
      status: 'in_trial',
    });

    setIsNewCaseOpen(false);
    setCaseNumber('');
    setSuitNumber('');
    setTitle('');
    setDescription('');
    setPresidingJudge('');
  };

  const statusConfig: Record<EvidenceStatus, { label: string; dot: string; text: string }> = {
    uploaded: { label: 'Uploaded', dot: 'bg-slate-400', text: 'text-slate-400' },
    queued: { label: 'Queued', dot: 'bg-blue-400', text: 'text-blue-400' },
    processing: { label: 'Processing', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400' },
    indexing: { label: 'Indexing', dot: 'bg-purple-400', text: 'text-purple-400' },
    completed: { label: 'Completed', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    completed_with_warnings: { label: 'Warnings', dot: 'bg-yellow-400', text: 'text-yellow-400' },
    failed: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-400' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-blue-950/60 border border-blue-900/60 text-blue-400 flex items-center justify-center font-bold">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
            <h1 className="text-lg lg:text-xl font-bold text-slate-100">
              Case & Evidence Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain judicial integrity, assign counsel, and manage audio/document evidence vaults.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canUploadEvidence() && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Evidence</span>
            </button>
          )}

          {canEditCase() && (
            <button
              onClick={() => setIsNewCaseOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 font-medium text-xs border border-slate-800 hover:border-slate-700 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>New Legal Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Cases Selector Grid */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          CASE DOSSIERS ({cases.length})
        </div>

        {cases.length === 0 ? (
          <div className="p-8 text-center bg-[#0F172A] border border-slate-800 rounded-xl space-y-2">
            <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-xs font-semibold text-slate-200">No cases recorded</h3>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Create a new legal dossier to manage hearings, witnesses, and exhibits.
            </p>
            <button
              onClick={() => setIsNewCaseOpen(true)}
              className="mt-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
            >
              Create First Case
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
                      ? 'bg-slate-900 border-blue-600/80 shadow-sm ring-1 ring-blue-600/30'
                      : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-medium text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40">
                        {c.caseNumber}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description || 'No description provided.'}</p>
                    <div className="text-[11px] text-slate-400 mt-2 font-mono">{c.court}</div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {c.evidence?.length || 0} Evidence Files
                    </span>
                    <span className={`text-[11px] font-medium ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                      {isSelected ? '● Active Matter' : 'Click to select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Case Evidence Dossier Table */}
      {activeCase && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40">
                  {activeCase.caseNumber}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400 font-mono">Presiding: {activeCase.presidingJudge || 'Hon. Justice'}</span>
              </div>
              <h2 className="text-base font-semibold text-slate-100 mt-1">{activeCase.title}</h2>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Evidence to Dossier</span>
            </button>
          </div>

          {/* Evidence Table */}
          {(!activeCase.evidence || activeCase.evidence.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No evidence files attached to this matter yet. Click "Add Evidence to Dossier" to upload.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Evidence File</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">SHA-256 Digest</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeCase.evidence.map((ev) => {
                    const status = statusConfig[ev.status] || { label: ev.status, dot: 'bg-slate-400', text: 'text-slate-400' };
                    return (
                      <tr key={ev.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {ev.fileType === 'audio' ? (
                              <span className="w-6 h-6 rounded bg-blue-950/50 text-blue-400 flex items-center justify-center shrink-0 border border-blue-900/40">
                                <Headphones className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded bg-indigo-950/50 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-900/40">
                                <FileText className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <div>
                              <div className="font-medium text-slate-200">{ev.fileName}</div>
                              <div className="text-[10px] text-slate-400">{ev.statusMessage}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 uppercase text-[10px] font-mono text-slate-400">
                          {ev.fileType}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5 text-emerald-400" title={ev.sha256Hash}>
                            <ShieldCheck className="w-3 h-3" />
                            {formatHashTruncated(ev.sha256Hash, 8)}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono">
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            <span className={status.text}>{status.label}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {(ev.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              if (ev.fileType === 'audio') navigate(`/audio?id=${ev.id}`);
                              else navigate(`/document?id=${ev.id}`);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-300 font-medium text-xs border border-slate-800 hover:border-blue-600 transition"
                          >
                            {ev.fileType === 'audio' ? 'Play' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Upload Evidence Modal */}
      <EvidenceUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        caseId={activeCase?.id}
      />

      {/* Create Case Modal */}
      {isNewCaseOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span>Create New Legal Matter</span>
              </h3>
              <button
                onClick={() => setIsNewCaseOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1 font-mono text-[11px]">
                  Case / Suit Number *
                </label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. CR/ACC/0482/2026"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 font-mono text-[11px]">
                  Case Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Republic v. Kwame Mensah & 2 Ors"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 font-mono text-[11px]">
                  Court Division
                </label>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  placeholder="e.g. High Court (Commercial Division), Accra"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 font-mono text-[11px]">
                  Presiding Judge
                </label>
                <input
                  type="text"
                  value={presidingJudge}
                  onChange={(e) => setPresidingJudge(e.target.value)}
                  placeholder="e.g. Hon. Justice Sophia Adinyira"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 font-mono text-[11px]">
                  Brief Case Summary / Indictment
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe charges, allegations, and key exhibits..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCaseOpen(false)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
                >
                  Create Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
