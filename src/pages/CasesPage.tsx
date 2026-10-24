import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Upload, 
  Headphones, 
  FileText, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
  Lock
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

  const statusBadges: Record<EvidenceStatus, { label: string; style: string }> = {
    uploaded: { label: 'Uploaded', style: 'bg-slate-800 text-slate-300 border-slate-700' },
    queued: { label: 'Queued', style: 'bg-blue-900/60 text-blue-300 border-blue-700' },
    processing: { label: 'Processing', style: 'bg-amber-900/60 text-amber-300 border-amber-700 animate-pulse' },
    indexing: { label: 'Indexing', style: 'bg-purple-900/60 text-purple-300 border-purple-700' },
    completed: { label: 'Completed', style: 'bg-emerald-900/60 text-emerald-300 border-emerald-700' },
    completed_with_warnings: { label: 'Completed with Warnings', style: 'bg-yellow-900/60 text-yellow-300 border-yellow-700' },
    failed: { label: 'Failed', style: 'bg-red-900/60 text-red-300 border-red-700' },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-slate-100">
              Case & Evidence Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain judicial integrity, assign counsel, and manage audio/document evidence vaults.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canUploadEvidence() && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Evidence</span>
            </button>
          )}

          {canEditCase() && (
            <button
              onClick={() => setIsNewCaseOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>New Legal Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Cases Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((c) => {
          const isSelected = activeCase?.id === c.id;
          return (
            <div
              key={c.id}
              onClick={() => selectCase(c.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-amber-500/60 shadow-xl shadow-amber-500/5'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {c.caseNumber}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{c.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                <div className="text-[11px] text-slate-400 mt-2">{c.court}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {c.evidence?.length || 0} Evidence Files
                </span>
                <span className={`font-semibold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                  {isSelected ? 'Active Matter' : 'Click to Open'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Case Evidence Dossier Table */}
      {activeCase && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {activeCase.caseNumber}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400">Presiding: {activeCase.presidingJudge || 'Hon. Justice'}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">{activeCase.title}</h2>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Evidence to Dossier</span>
            </button>
          </div>

          {/* Evidence Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Evidence File</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">SHA-256 Digest</th>
                  <th className="py-3 px-4">Processing Status</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeCase.evidence?.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {ev.fileType === 'audio' ? (
                          <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                            <Headphones className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </span>
                        )}
                        <div>
                          <div className="font-bold text-slate-200">{ev.fileName}</div>
                          <div className="text-[10px] text-slate-400">{ev.statusMessage}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium uppercase text-[10px] text-slate-400">
                      {ev.fileType}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold" title={ev.sha256Hash}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {formatHashTruncated(ev.sha256Hash, 8)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          statusBadges[ev.status]?.style || ''
                        }`}
                      >
                        {statusBadges[ev.status]?.label || ev.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {(ev.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          if (ev.fileType === 'audio') navigate(`/audio?id=${ev.id}`);
                          else navigate(`/document?id=${ev.id}`);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-semibold transition"
                      >
                        {ev.fileType === 'audio' ? 'Play' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>Create New Legal Matter</span>
              </h3>
              <button
                onClick={() => setIsNewCaseOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Case / Suit Number *
                </label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. CR/ACC/0482/2026"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Case Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Republic v. Kwame Mensah & 2 Ors"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Court Division</label>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  placeholder="e.g. High Court (Commercial Division), Accra"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Brief Case Summary / Indictment Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe charges, allegations, and key exhibits involved..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCaseOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
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
