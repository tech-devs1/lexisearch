import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  Headphones, 
  FileText, 
  Layers, 
  ArrowUpDown,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { UnifiedSearchBar } from '../components/search/UnifiedSearchBar';
import { SearchResultCard } from '../components/search/SearchResultCard';
import { SearchFilters, SearchMode, SearchResultItem, GroupedSearchResults } from '../types/search';
import { globalSearchEngine } from '../services/searchEngine';
import { performSemanticSearch } from '../services/semanticSearch';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { globalAuditService } from '../services/auditService';

export const UnifiedSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { evidenceList, activeCase } = useCase();
  const { currentUser } = useAuth();

  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>('keyword');
  const [filters, setFilters] = useState<SearchFilters>({ evidenceType: 'all' });
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedSearchResults[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [audioCount, setAudioCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  // Trigger search on mount if URL query param exists
  useEffect(() => {
    if (initialQuery.trim()) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const executeSearch = (searchQuery?: string) => {
    const q = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!q) {
      setResults([]);
      setGroupedResults([]);
      setTotalMatches(0);
      setAudioCount(0);
      setDocCount(0);
      setHasSearched(false);
      return;
    }

    setSearchParams({ q });

    if (mode === 'semantic') {
      // AI Semantic Search
      const semanticMatches = performSemanticSearch(evidenceList, q);
      let filtered = semanticMatches;
      if (filters.evidenceType && filters.evidenceType !== 'all') {
        filtered = filtered.filter(m => m.type === filters.evidenceType);
      }

      setResults(filtered);
      setTotalMatches(filtered.length);
      setAudioCount(filtered.filter(m => m.type === 'audio').length);
      setDocCount(filtered.filter(m => m.type === 'document').length);

      // Group
      const gMap = new Map<string, GroupedSearchResults>();
      for (const m of filtered) {
        if (!gMap.has(m.evidenceId)) {
          gMap.set(m.evidenceId, {
            evidenceId: m.evidenceId,
            fileName: m.fileName,
            fileType: m.type,
            sha256Hash: '',
            matches: [],
            totalMatches: 0,
          });
        }
        const g = gMap.get(m.evidenceId)!;
        g.matches.push(m);
        g.totalMatches++;
      }
      setGroupedResults(Array.from(gMap.values()));
    } else {
      // Exact Keyword or Exact Phrase Search via EvidenceSearchEngine
      const res = globalSearchEngine.search(q, mode, filters);
      setResults(res.results);
      setGroupedResults(res.groupedResults);
      setTotalMatches(res.totalMatches);
      setAudioCount(res.audioMatchesCount);
      setDocCount(res.documentMatchesCount);
    }

    setHasSearched(true);

    if (currentUser && activeCase) {
      globalAuditService.logAction({
        caseId: activeCase.id,
        action: 'SEARCH_QUERY',
        actionDescription: `Executed search for "${q}" [Mode: ${mode}] - ${results.length} matches`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        metadata: { query: q, mode, filters },
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-blue-950/60 border border-blue-900/60 text-blue-400 flex items-center justify-center font-bold">
            <Search className="w-3.5 h-3.5" />
          </span>
          <h1 className="text-lg lg:text-xl font-bold text-slate-100">
            Unified Evidentiary Search
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Search across witness audio recordings, police statements, forensic financial ledgers, and court transcripts.
        </p>
      </div>

      {/* Search Bar & Mode Selector */}
      <UnifiedSearchBar
        query={query}
        onQueryChange={setQuery}
        onSearch={() => executeSearch()}
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          if (query.trim()) {
            setTimeout(() => executeSearch(), 50);
          }
        }}
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          if (query.trim()) {
            setTimeout(() => executeSearch(), 50);
          }
        }}
      />

      {/* Results Statistics Bar */}
      {hasSearched && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F172A] border border-slate-800 rounded-lg px-4 py-2.5 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200 font-mono text-[11px]">
              {totalMatches} {totalMatches === 1 ? 'Match' : 'Matches'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="flex items-center gap-1.5 text-blue-400 font-mono text-[11px]">
              <Headphones className="w-3 h-3" />
              {audioCount} in Audio
            </span>
            <span className="text-slate-400">•</span>
            <span className="flex items-center gap-1.5 text-indigo-400 font-mono text-[11px]">
              <FileText className="w-3 h-3" />
              {docCount} in Documents
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px]">VIEW:</span>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Grouped
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Flat List
            </button>
          </div>
        </div>
      )}

      {/* Results Display */}
      {hasSearched ? (
        totalMatches === 0 ? (
          <div className="text-center py-16 bg-[#0F172A] border border-slate-800 rounded-xl p-8 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No matching evidence found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No audio segments or document pages matched your search query "{query}".
              Try adjusting terms or switching to AI Semantic Search.
            </p>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="space-y-4">
            {groupedResults.map((group) => (
              <div
                key={group.evidenceId}
                className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    {group.fileType === 'audio' ? (
                      <Headphones className="w-4 h-4 text-blue-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-indigo-400" />
                    )}
                    <h3 className="text-xs font-semibold text-slate-100 font-mono">{group.fileName}</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-blue-400 font-mono border border-slate-800">
                    {group.totalMatches} {group.totalMatches === 1 ? 'match' : 'matches'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.matches.map((item, idx) => (
                    <SearchResultCard key={idx} item={item} query={query} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((item, idx) => (
              <SearchResultCard key={idx} item={item} query={query} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-[#0F172A] border border-slate-800 rounded-xl p-8 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Ready to Search Case Evidence
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Type names, dates, financial amounts, or speak into the microphone to locate exact words in audio transcripts and document exhibits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
