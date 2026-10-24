import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Trash2, 
  Headphones, 
  FileText, 
  ExternalLink, 
  Clock, 
  Tag, 
  Search 
} from 'lucide-react';
import { useCase } from '../context/CaseContext';

export const BookmarksPage: React.FC = () => {
  const { bookmarks, deleteBookmark, activeCase } = useCase();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'document'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = bookmarks.filter((bm) => {
    if (filterType !== 'all' && bm.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        bm.passageSnippet.toLowerCase().includes(q) ||
        bm.note.toLowerCase().includes(q) ||
        bm.fileName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleNavigate = (bm: any) => {
    if (bm.type === 'audio') {
      navigate(`/audio?id=${bm.evidenceId}&seek=${bm.timestamp || 0}`);
    } else {
      navigate(`/document?id=${bm.evidenceId}&page=${bm.pageNumber || 1}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Bookmark className="w-4 h-4" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-slate-100">
              Evidentiary Bookmarks & Legal Annotations
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pinned testimony segments, exhibit ledger passages, and investigative notes.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({bookmarks.length})
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filterType === 'audio' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            Audio Only
          </button>
          <button
            onClick={() => setFilterType('document')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filterType === 'document' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documents Only
          </button>
        </div>
      </div>

      {/* Search Filter Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter bookmarks by note, witness, or passage text..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3">
          <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No bookmarks found</h3>
          <p className="text-xs text-slate-400">
            Bookmark relevant audio transcript timestamps or document pages while reviewing evidence.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookmarks.map((bm) => (
            <div
              key={bm.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {bm.type === 'audio' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Headphones className="w-3 h-3" />
                        Audio Testimony
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Exhibit Document
                      </span>
                    )}

                    <span className="text-xs font-mono font-semibold text-amber-400">
                      {bm.type === 'audio' ? `[${bm.timestampDisplay}]` : `[Page ${bm.pageNumber}]`}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteBookmark(bm.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                    title="Delete Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="font-bold text-slate-200 text-xs mb-1.5">{bm.fileName}</div>

                {/* Quoted Passage */}
                <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 text-xs text-slate-300 font-serif leading-relaxed italic">
                  "{bm.passageSnippet}"
                </div>

                {/* Counsel Note */}
                <div className="mt-3 text-xs text-slate-300">
                  <span className="font-semibold text-amber-400">Counsel Annotation: </span>
                  {bm.note}
                </div>

                {/* Tags */}
                {bm.tags && bm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {bm.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-amber-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Created by {bm.createdBy.displayName}
                </span>

                <button
                  onClick={() => handleNavigate(bm)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold transition flex items-center gap-1.5"
                >
                  <span>Open in {bm.type === 'audio' ? 'Player' : 'Viewer'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
