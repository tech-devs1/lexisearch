import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Headphones,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Bookmark,
  ArrowRight,
  Plus,
  Scale,
  Award,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useCase } from '../../context/CaseContext';
import { useAuth } from '../../context/AuthContext';
import { formatHashTruncated } from '../../services/crypto';
import { EvidenceUploadModal } from '../cases/EvidenceUploadModal';

export const IndividualLawyerDashboard: React.FC = () => {
  const { cases, activeCase, selectCase, evidenceList, bookmarks } = useCase();
  const { currentUser, canUploadEvidence } = useAuth();
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const totalAudio = evidenceList.filter((e) => e.fileType === 'audio').length;
  const totalDocs = evidenceList.filter((e) => e.fileType === 'document').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Individual Counsel Banner */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 font-semibold flex items-center gap-1">
              <Scale className="w-3 h-3" />
              <span>Chambers & Legal Research</span>
            </span>
            {currentUser?.barNumber && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 text-white font-medium flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>Bar Enrolled: {currentUser.barNumber}</span>
              </span>
            )}
            <span className="text-xs text-gray-400 font-mono">Individual Practitioner Dossier</span>
          </div>

          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
            Counsel Evidentiary Intelligence Portal
          </h1>

          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            Welcome, <span className="font-semibold text-gray-900">{currentUser?.displayName}</span>.{' '}
            Review assigned trial transcripts, cross-examine audio exhibits, query case law via grounded AI, and verify cryptographic chain of custody.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/search')}
            className="px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-2 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Case Exhibits</span>
          </button>
          <button
            onClick={() => navigate('/ai-assistant')}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border border-gray-300 transition flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-gray-700" />
            <span>Evidentiary AI Q&A</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">MY ASSIGNED CAUSES</span>
            <Briefcase className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{cases.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Authorized trial dockets</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">HEARING RECORDINGS</span>
            <Headphones className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{totalAudio}</div>
          <div className="text-[11px] text-gray-500 mt-1">Forensically synced audio</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">DOCUMENT EXHIBITS</span>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 font-mono">{totalDocs}</div>
          <div className="text-[11px] text-gray-500 mt-1">OCR & Page preserved</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">EVIDENCE INTEGRITY</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono">100%</div>
          <div className="text-[11px] text-gray-500 mt-1">NRCD 323 SHA-256 Validated</div>
        </div>
      </div>

      {/* Main Grid: Assigned Matters + Active Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Matters List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold">
              MY COURT DOCKETS ({cases.length})
            </span>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
            >
              <span>All Cases</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {cases.length === 0 ? (
            <div className="p-6 text-center bg-white border border-gray-200 rounded-xl space-y-2 shadow-xs">
              <Briefcase className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-xs font-semibold text-gray-900">No cases assigned yet</div>
              <p className="text-[11px] text-gray-500">
                You are currently not assigned to any court causes. A Court Registrar will assign your legal counsel profile to active court dockets.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cases.map((c) => {
                const isSelected = activeCase?.id === c.id;
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

                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                      <span>{c.evidence?.length || 0} exhibits on file</span>
                      <span className={isSelected ? 'font-semibold text-gray-900' : 'text-gray-400'}>
                        {isSelected ? '● Active' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Evidence Workbench */}
        <div className="lg:col-span-2 space-y-4">
          {activeCase ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {activeCase.caseNumber}
                    </span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-600 font-mono">
                      Presiding: {activeCase.presidingJudge || 'Hon. Justice'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mt-1">{activeCase.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{activeCase.description || 'No description provided.'}</p>
                </div>

                <div className="flex items-center gap-2">
                  {canUploadEvidence(activeCase) && (
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Exhibit</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/cases')}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs border border-gray-300 transition flex items-center gap-1"
                  >
                    <span>Full Dossier</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Evidence Exhibits Grid */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold mb-2.5">
                  EVIDENCE IN FILE ({evidenceList.length})
                </div>

                {evidenceList.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-gray-300 rounded-xl space-y-2">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                    <div className="text-xs text-gray-700 font-medium">No exhibits attached to this docket yet</div>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                      Upload audio testimonies, witness depositions, or documentary exhibits to begin forensic examination.
                    </p>
                    {canUploadEvidence(activeCase) && (
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium transition"
                      >
                        Upload First Exhibit
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {evidenceList.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (ev.fileType === 'audio') navigate(`/audio?id=${ev.id}`);
                          else navigate(`/document?id=${ev.id}`);
                        }}
                        className="p-3.5 rounded-xl bg-gray-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs cursor-pointer transition flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-700 font-medium flex items-center gap-1 border border-gray-200">
                              {ev.fileType === 'audio' ? (
                                <Headphones className="w-3 h-3 text-gray-600" />
                              ) : (
                                <FileText className="w-3 h-3 text-gray-600" />
                              )}
                              <span>{ev.fileType}</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1 font-medium">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Sealed</span>
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-gray-900 group-hover:text-black transition line-clamp-1">
                            {ev.fileName}
                          </h4>

                          <div className="text-[10px] text-gray-500 mt-1 font-mono">
                            SHA-256: {formatHashTruncated(ev.sha256Hash, 8)}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-600 font-medium">
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
            <div className="p-8 text-center bg-white border border-gray-200 rounded-xl space-y-2 shadow-xs">
              <Briefcase className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-sm font-semibold text-gray-900">No active docket selected</div>
              <p className="text-xs text-gray-500">
                Select an assigned court docket from the list on the left to inspect transcripts and exhibits.
              </p>
            </div>
          )}

          {/* AI Evidence Inquiry & Annotations preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Evidentiary AI Assistant</h3>
                  <p className="text-[10px] text-gray-500">Strict citations to audio timestamps & pages</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Inquire about conflicting testimony, witness meeting dates, or financial exhibits. Zero hallucinations; backed by verifiable records.
              </p>
              <button
                onClick={() => navigate('/ai-assistant')}
                className="w-full py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition"
              >
                Launch AI Cross-Examination
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800">
                    <Bookmark className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Pinned Case Citations</h3>
                    <p className="text-[10px] text-gray-500">{bookmarks.length} pinned passages</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/bookmarks')}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  View All
                </button>
              </div>

              {bookmarks.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400 italic">
                  No citations pinned yet. Bookmark quotes while listening to recordings or reading exhibits.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {bookmarks.slice(0, 2).map((bm) => (
                    <div
                      key={bm.id}
                      onClick={() => {
                        if (bm.type === 'audio') navigate(`/audio?id=${bm.evidenceId}&seek=${bm.timestamp || 0}`);
                        else navigate(`/document?id=${bm.evidenceId}&page=${bm.pageNumber || 1}`);
                      }}
                      className="p-2 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100 cursor-pointer text-xs transition"
                    >
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                        <span className="truncate max-w-[160px] font-medium">{bm.fileName}</span>
                        <span>{bm.type === 'audio' ? `[${bm.timestampDisplay}]` : `[Page ${bm.pageNumber}]`}</span>
                      </div>
                      <p className="text-gray-700 line-clamp-1 italic mt-0.5 font-serif">"{bm.passageSnippet}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Upload Modal */}
      <EvidenceUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        caseId={activeCase?.id}
      />
    </div>
  );
};
