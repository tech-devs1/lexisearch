import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Headphones, 
  FileText
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
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center font-bold">
            <Search className="w-3.5 h-3.5" />
          </span>
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">
            Unified Evidentiary Search
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
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
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900 font-mono text-[11px]">
              {totalMatches} {totalMatches === 1 ? 'Match' : 'Matches'}
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1.5 text-gray-700 font-mono text-[11px]">
              <Headphones className="w-3.5 h-3.5 text-gray-500" />
              {audioCount} in Audio
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1.5 text-gray-700 font-mono text-[11px]">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              {docCount} in Documents
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-mono text-[10px] font-semibold">VIEW:</span>
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === 'grouped'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grouped
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Flat List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {hasSearched ? (
        totalMatches === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-8 space-y-2 shadow-xs">
            <div className="w-10 h-10 mx-auto rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No matching evidence found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No audio segments or document pages matched your search query "{query}".
              Try adjusting terms or switching to AI Semantic Search.
            </p>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="space-y-4">
            {groupedResults.map((group) => (
              <div
                key={group.evidenceId}
                className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    {group.fileType === 'audio' ? (
                      <Headphones className="w-4 h-4 text-gray-700" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-700" />
                    )}
                    <h3 className="text-xs font-semibold text-gray-900 font-mono">{group.fileName}</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono border border-gray-200 font-medium">
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
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-8 space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Ready to Search Case Evidence
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Type names, dates, financial amounts, or speak into the microphone to locate exact words in audio transcripts and document exhibits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
