import React from 'react';
import { Search, Sparkles, Filter, FileText, Headphones, Check } from 'lucide-react';
import { SearchFilters, SearchMode } from '../../types/search';

interface UnifiedSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  mode,
  onModeChange,
  filters,
  onFilterChange,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl space-y-4">
      {/* Mode Switches */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => onModeChange('keyword')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'keyword'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exact Keyword
          </button>
          <button
            type="button"
            onClick={() => onModeChange('exact_phrase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'exact_phrase'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exact Phrase "..."
          </button>
          <button
            type="button"
            onClick={() => onModeChange('semantic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              mode === 'semantic'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Semantic (By Meaning)
          </button>
        </div>

        {/* Evidence Type Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'all' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              !filters.evidenceType || filters.evidenceType === 'all'
                ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            All Evidence
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'audio' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              filters.evidenceType === 'audio'
                ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            Audio Only
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, evidenceType: 'document' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              filters.evidenceType === 'document'
                ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documents Only
          </button>
        </div>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={
              mode === 'semantic'
                ? 'Search by meaning, e.g. "Where did the witness discuss receiving money or wire transfers?"'
                : mode === 'exact_phrase'
                ? 'Search exact courtroom quotes, e.g. "Kempinski Hotel in Accra"'
                : 'Enter keywords, names, dates, amounts, e.g. "450,000", "Tema Port", "Exhibit P7"'
            }
            className="w-full pl-12 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Execute Search</span>
        </button>
      </form>

      {/* Hint for Search Quality */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          {mode === 'semantic' ? (
            <span className="text-purple-300">
              * Semantic search retrieves conceptually related passages even if exact terms differ (e.g., money ↔ 450,000 Cedis transfer).
            </span>
          ) : (
            <span>* Searches word-level audio transcripts and page-preserved document exhibits simultaneously.</span>
          )}
        </span>
      </div>
    </div>
  );
};
