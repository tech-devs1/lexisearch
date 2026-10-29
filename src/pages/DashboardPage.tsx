import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Headphones, 
  FileText, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Bookmark,
  Plus,
  Scale
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../types/auth';
import { formatHashTruncated } from '../services/crypto';

export const DashboardPage: React.FC = () => {
  const { cases, activeCase, evidenceList, bookmarks } = useCase();
  const { currentUser, role, canCreateCase, canUploadEvidence } = useAuth();
  const navigate = useNavigate();

  const totalAudioEvidence = evidenceList.filter(e => e.fileType === 'audio').length;
  const totalDocEvidence = evidenceList.filter(e => e.fileType === 'document').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Institutional Header Banner */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
              Judicial Service of Ghana
            </span>
            <span className="text-xs text-gray-400 font-mono">GLEIS Institutional Core</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-900 text-white font-medium">
              {ROLE_LABELS[role] || role}
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 tracking-tight">
            Legal Evidence Intelligence Portal
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Authenticated as <span className="font-medium text-gray-900">{currentUser?.displayName}</span> ({ROLE_LABELS[role]}).{' '}
            {ROLE_DESCRIPTIONS[role] || 'Cross-examine verbatim transcripts, analyze document exhibits, and trace cryptographic chain of custody.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/search')}
            className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-2 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Unified Search</span>
          </button>
          <button
            onClick={() => navigate('/cases')}
            className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border border-gray-300 transition flex items-center gap-2"
          >
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <span>Manage Cases</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-mono text-[10px] uppercase tracking-wider">ACTIVE DOSSIERS</span>
            <Briefcase className="w-4 h-4 text-gray-300" />
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-2 font-mono">{cases.length}</div>
          <div className="text-[11px] text-gray-400 mt-1">High & Commercial Courts</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-mono text-[10px] uppercase tracking-wider">AUDIO TESTIMONIES</span>
            <Headphones className="w-4 h-4 text-gray-300" />
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-2 font-mono">{totalAudioEvidence}</div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">Word-level synced</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-mono text-[10px] uppercase tracking-wider">EXHIBITS & AFFIDAVITS</span>
            <FileText className="w-4 h-4 text-gray-300" />
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-2 font-mono">{totalDocEvidence}</div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">OCR & Page indexing</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-mono text-[10px] uppercase tracking-wider">CHAIN OF CUSTODY</span>
            <ShieldCheck className="w-4 h-4 text-gray-300" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 mt-2 font-mono">100%</div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">SHA-256 Verified</div>
        </div>
      </div>

      {/* Active Dossier Overview & Evidence Grid */}
      {activeCase ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  {activeCase.caseNumber}
                </span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-500">{activeCase.court}</span>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mt-1">
                {activeCase.title}
              </h2>
            </div>

            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition"
            >
              <span>View Case Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Evidence Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                EVIDENCE IN FILE ({evidenceList.length})
              </span>
              {canUploadEvidence(activeCase) && (
                <button
                  onClick={() => navigate('/cases')}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Upload Evidence</span>
                </button>
              )}
            </div>

            {evidenceList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-300 rounded-xl space-y-2">
                <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                <div className="text-xs text-gray-700 font-medium">No evidence in this dossier yet</div>
                <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                  {canUploadEvidence(activeCase)
                    ? 'Upload audio recordings, video statements, or legal document exhibits to begin search & analysis.'
                    : 'Awaiting evidence ingest by authorized counsel or lead investigator.'}
                </p>
                {canUploadEvidence(activeCase) && (
                  <button
                    onClick={() => navigate('/cases')}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition"
                  >
                    Upload Evidence File
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      if (ev.fileType === 'audio') navigate(`/audio?id=${ev.id}`);
                      else navigate(`/document?id=${ev.id}`);
                    }}
                    className="p-3.5 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-500 flex items-center gap-1 border border-gray-200">
                          {ev.fileType === 'audio' ? (
                            <Headphones className="w-3 h-3 text-gray-400" />
                          ) : (
                            <FileText className="w-3 h-3 text-gray-400" />
                          )}
                          {ev.fileType}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Sealed
                        </span>
                      </div>

                      <h4 className="text-xs font-medium text-gray-900 group-hover:text-gray-700 transition line-clamp-2">
                        {ev.fileName}
                      </h4>

                      <div className="text-[10px] text-gray-400 mt-2 font-mono truncate">
                        SHA-256: {formatHashTruncated(ev.sha256Hash, 8)}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span>{ev.fileType === 'audio' ? 'Play Recording' : 'Read Exhibit'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-xl space-y-3">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-900">No Legal Cases Active</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {canCreateCase()
              ? 'Create your first legal case dossier or upload evidence to start searching court transcripts and documents.'
              : 'You do not have any active legal matters assigned to your account. Contact an administrator for assignment.'}
          </p>
          {canCreateCase() ? (
            <button
              onClick={() => navigate('/cases')}
              className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition"
            >
              Create New Legal Dossier
            </button>
          ) : (
            <button
              onClick={() => navigate('/cases')}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium text-xs transition"
            >
              View Case Catalog
            </button>
          )}
        </div>
      )}

      {/* Split Section: AI Evidence Assistant & Bookmarks Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Evidence Inquiries */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Evidentiary AI Assistant (RAG)</h3>
              <p className="text-[11px] text-gray-400">Strict citations to audio timestamps & document pages</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Inquire about contradictory statements, financial deposits, or witness meeting dates.
            All assertions are grounded strictly in case exhibits without hallucinations.
          </p>

          <button
            onClick={() => navigate('/ai-assistant')}
            className="w-full py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs border border-gray-200 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-gray-400" />
            <span>Launch Evidentiary Q&A</span>
          </button>
        </div>

        {/* Bookmarks Preview */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Evidentiary Annotations</h3>
                <p className="text-[11px] text-gray-400">{bookmarks.length} pinned passages</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/bookmarks')}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition"
            >
              View All
            </button>
          </div>

          {bookmarks.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400 font-serif italic">
              No bookmarked passages yet. Pin quotes while reviewing transcripts or exhibits.
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.slice(0, 2).map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => {
                    if (bm.type === 'audio') navigate(`/audio?id=${bm.evidenceId}&seek=${bm.timestamp || 0}`);
                    else navigate(`/document?id=${bm.evidenceId}&page=${bm.pageNumber || 1}`);
                  }}
                  className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 cursor-pointer transition text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono mb-1">
                    <span className="truncate max-w-[200px]">{bm.fileName}</span>
                    <span>{bm.type === 'audio' ? `[${bm.timestampDisplay}]` : `[Page ${bm.pageNumber}]`}</span>
                  </div>
                  <p className="text-gray-700 font-serif line-clamp-1">"{bm.passageSnippet}"</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">Note: {bm.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
