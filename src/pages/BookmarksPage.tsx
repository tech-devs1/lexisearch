import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Trash2, 
  Headphones, 
  FileText, 
  ExternalLink, 
  Tag, 
  Search 
} from 'lucide-react';
import { useCase } from '../context/CaseContext';

export const BookmarksPage: React.FC = () => {
  const { bookmarks, deleteBookmark } = useCase();
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
              <Bookmark className="w-3.5 h-3.5" />
            </span>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">
              Evidentiary Bookmarks & Legal Annotations
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pinned testimony segments, exhibit ledger passages, and investigative notes.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              filterType === 'all' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({bookmarks.length})
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              filterType === 'audio' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            Audio Only
          </button>
          <button
            onClick={() => setFilterType('document')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              filterType === 'document' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documents Only
          </button>
        </div>
      </div>

      {/* Search Filter Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter bookmarks by note, witness, or passage text..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
        />
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-8 space-y-2 shadow-xs">
          <div className="w-10 h-10 mx-auto rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No bookmarks found</h3>
          <p className="text-xs text-gray-500">
            Bookmark relevant audio transcript timestamps or document pages while reviewing evidence.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookmarks.map((bm) => (
            <div
              key={bm.id}
              className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-4 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {bm.type === 'audio' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 font-medium">
                        <Headphones className="w-3 h-3" />
                        Audio Testimony
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 font-medium">
                        <FileText className="w-3 h-3" />
                        Exhibit Document
                      </span>
                    )}

                    <span className="text-xs font-mono font-semibold text-gray-900">
                      {bm.type === 'audio' ? `[${bm.timestampDisplay}]` : `[Page ${bm.pageNumber}]`}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteBookmark(bm.id)}
                    className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100 transition"
                    title="Delete Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="font-semibold text-gray-900 text-xs mb-1.5">{bm.fileName}</div>

                {/* Quoted Passage */}
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800 font-serif leading-relaxed italic">
                  "{bm.passageSnippet}"
                </div>

                {/* Counsel Note */}
                <div className="mt-3 text-xs text-gray-700">
                  <span className="font-semibold text-gray-900">Counsel Annotation: </span>
                  {bm.note}
                </div>

                {/* Tags */}
                {bm.tags && bm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {bm.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-gray-500" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-500">
                  Created by {bm.createdBy.displayName}
                </span>

                <button
                  onClick={() => handleNavigate(bm)}
                  className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-xs transition flex items-center gap-1.5 shadow-xs"
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
