import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Briefcase, 
  Headphones, 
  FileText, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  Clock, 
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { formatHashTruncated } from '../services/crypto';

export const DashboardPage: React.FC = () => {
  const { cases, activeCase, evidenceList, bookmarks } = useCase();
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const totalAudioEvidence = evidenceList.filter(e => e.fileType === 'audio').length;
  const totalDocEvidence = evidenceList.filter(e => e.fileType === 'document').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 lg:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Judicial Service of Ghana
              </span>
              <span className="text-xs text-slate-400 font-mono">GLEIS Core v1.0</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
              Evidence Intelligence Portal
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Welcome, <span className="font-semibold text-amber-400">{currentUser?.displayName}</span> ({role.toUpperCase()}).
              Locate exact words, witness quotes, and bank figures across hours of courtroom audio and hundreds of exhibit pages in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/search')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Launch Unified Search</span>
            </button>
            <button
              onClick={() => navigate('/cases')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-amber-400" />
              <span>Manage Cases</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ACTIVE CASES</span>
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{cases.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Superior & Commercial Courts</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AUDIO TESTIMONIES</span>
            <Headphones className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{totalAudioEvidence}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Word-level timestamps synced</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>EXHIBITS & AFFIDAVITS</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{totalDocEvidence}</div>
          <div className="text-[11px] text-blue-400 mt-1">OCR & Page structure indexed</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CHAIN OF CUSTODY</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">100%</div>
          <div className="text-[11px] text-slate-400 mt-1">Cryptographic SHA-256 Sealed</div>
        </div>
      </div>

      {/* Active Matter Overview & Evidence Shelf */}
      {activeCase && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-amber-400">
                  {activeCase.caseNumber}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400">{activeCase.court}</span>
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-slate-100 mt-1">
                {activeCase.title}
              </h2>
            </div>

            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View Case Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Evidence Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Incorporated Evidence Files ({evidenceList.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {evidenceList.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    if (ev.fileType === 'audio') navigate(`/audio?id=${ev.id}`);
                    else navigate(`/document?id=${ev.id}`);
                  }}
                  className="p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 flex items-center gap-1">
                        {ev.fileType === 'audio' ? (
                          <Headphones className="w-3 h-3 text-amber-400" />
                        ) : (
                          <FileText className="w-3 h-3 text-blue-400" />
                        )}
                        {ev.fileType}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">Verified</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition line-clamp-2">
                      {ev.fileName}
                    </h4>

                    <div className="text-[11px] text-slate-400 mt-2 font-mono truncate">
                      SHA: {formatHashTruncated(ev.sha256Hash, 8)}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-medium">
                    <span>{ev.fileType === 'audio' ? 'Play Recording' : 'Read Exhibit'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Section: AI Assistant Teaser & Recent Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Evidence Inquiries */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">AI Evidentiary Q&A</h3>
              <p className="text-xs text-slate-400">Grounded analysis with strict courtroom citations</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Need to know if a witness contradicted themselves or where a specific wire transfer was mentioned?
            The AI Evidence Engine answers questions with direct citations to audio timestamps and document pages.
          </p>

          <button
            onClick={() => navigate('/ai-assistant')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open AI Legal Assistant</span>
          </button>
        </div>

        {/* Bookmarks Preview */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Bookmark className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-100">Legal Bookmarks & Notes</h3>
                <p className="text-xs text-slate-400">{bookmarks.length} pinned passages</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/bookmarks')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {bookmarks.slice(0, 2).map((bm) => (
              <div
                key={bm.id}
                onClick={() => {
                  if (bm.type === 'audio') navigate(`/audio?id=${bm.evidenceId}&seek=${bm.timestamp || 0}`);
                  else navigate(`/document?id=${bm.evidenceId}&page=${bm.pageNumber || 1}`);
                }}
                className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 cursor-pointer transition text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold mb-1">
                  <span>{bm.fileName}</span>
                  <span>{bm.type === 'audio' ? `[${bm.timestampDisplay}]` : `[Page ${bm.pageNumber}]`}</span>
                </div>
                <p className="text-slate-300 font-serif line-clamp-1">"{bm.passageSnippet}"</p>
                <p className="text-[11px] text-slate-400 mt-1 italic">Note: {bm.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
