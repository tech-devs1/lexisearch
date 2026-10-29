import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Upload, 
  Headphones, 
  FileText, 
  ShieldCheck, 
  FolderOpen
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { EvidenceUploadModal } from '../components/cases/EvidenceUploadModal';
import { formatHashTruncated } from '../services/crypto';
import { EvidenceStatus } from '../types/evidence';

export const CasesPage: React.FC = () => {
  const { cases, activeCase, selectCase, createCase } = useCase();
  const { canCreateCase, canEditCase, canUploadEvidence } = useAuth();
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
    uploaded: { label: 'Uploaded', dot: 'bg-gray-400', text: 'text-gray-600' },
    queued: { label: 'Queued', dot: 'bg-blue-500', text: 'text-blue-600' },
    processing: { label: 'Processing', dot: 'bg-amber-500 animate-pulse', text: 'text-amber-600' },
    indexing: { label: 'Indexing', dot: 'bg-purple-500', text: 'text-purple-600' },
    completed: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-600' },
    completed_with_warnings: { label: 'Warnings', dot: 'bg-yellow-500', text: 'text-yellow-600' },
    failed: { label: 'Failed', dot: 'bg-red-500', text: 'text-red-600' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">
              Case & Evidence Management
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Maintain judicial integrity, assign counsel, and manage audio/document evidence vaults.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeCase && canUploadEvidence(activeCase) && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Evidence</span>
            </button>
          )}

          {canCreateCase() && (
            <button
              onClick={() => setIsNewCaseOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border border-gray-300 transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-gray-600" />
              <span>New Legal Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Cases Selector Grid */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
          CASE DOSSIERS ({cases.length})
        </div>

        {cases.length === 0 ? (
          <div className="p-8 text-center bg-white border border-gray-200 rounded-xl space-y-2 shadow-xs">
            <FolderOpen className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="text-xs font-semibold text-gray-900">No cases recorded</h3>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              {canCreateCase()
                ? 'Create a new legal dossier to manage hearings, witnesses, and exhibits.'
                : 'No matters currently assigned to your account. Contact an administrator for assignment.'}
            </p>
            {canCreateCase() && (
              <button
                onClick={() => setIsNewCaseOpen(true)}
                className="mt-1 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition shadow-xs"
              >
                Create First Case
              </button>
            )}
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
                      <span className="text-xs font-mono font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {c.caseNumber}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-gray-600 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description || 'No description provided.'}</p>
                    <div className="text-[11px] text-gray-400 mt-2 font-mono">{c.court}</div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono text-[11px]">
                      {c.evidence?.length || 0} Evidence Files
                    </span>
                    <span className={`text-[11px] font-medium ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
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
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  {activeCase.caseNumber}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 font-mono">Presiding: {activeCase.presidingJudge || 'Hon. Justice'}</span>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mt-1">{activeCase.title}</h2>
            </div>

            {canUploadEvidence(activeCase) && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Add Evidence to Dossier</span>
              </button>
            )}
          </div>

          {/* Evidence Table */}
          {(!activeCase.evidence || activeCase.evidence.length === 0) ? (
            <div className="py-8 text-center text-xs text-gray-500 font-mono">
              No evidence files attached to this matter yet. Click "Add Evidence to Dossier" to upload.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200 font-mono">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Evidence File</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">SHA-256 Digest</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Size</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeCase.evidence.map((ev) => {
                    const status = statusConfig[ev.status] || { label: ev.status, dot: 'bg-gray-400', text: 'text-gray-600' };
                    return (
                      <tr key={ev.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {ev.fileType === 'audio' ? (
                              <span className="w-6 h-6 rounded bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 border border-gray-200">
                                <Headphones className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 border border-gray-200">
                                <FileText className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{ev.fileName}</div>
                              <div className="text-[10px] text-gray-500">{ev.statusMessage}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 uppercase text-[10px] font-mono text-gray-500">
                          {ev.fileType}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-gray-600">
                          <span className="flex items-center gap-1.5 text-emerald-600" title={ev.sha256Hash}>
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

                        <td className="py-3 px-3 font-mono text-gray-500 text-[11px]">
                          {(ev.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              if (ev.fileType === 'audio') navigate(`/audio?id=${ev.id}`);
                              else navigate(`/document?id=${ev.id}`);
                            }}
                            className="px-2.5 py-1 rounded-md bg-white hover:bg-gray-900 hover:text-white text-gray-700 font-medium text-xs border border-gray-200 hover:border-gray-900 transition shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-800" />
                <span>Create New Legal Matter</span>
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
                  Case / Suit Number *
                </label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. CR/ACC/0482/2026"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 font-mono focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
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
                  placeholder="e.g. The Republic v. Kwame Mensah & 2 Ors"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
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
                  placeholder="e.g. High Court (Commercial Division), Accra"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
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
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 font-mono text-[11px]">
                  Brief Case Summary / Indictment
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe charges, allegations, and key exhibits..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCaseOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition shadow-xs"
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
