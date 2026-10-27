import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Headphones, 
  FileText, 
  Play, 
  ExternalLink, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { SearchResultItem } from '../../types/search';
import { formatSecondsToTimestamp } from '../../services/audioProcessor';

interface SearchResultCardProps {
  item: SearchResultItem;
  query: string;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ item, query }) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (item.type === 'audio') {
      navigate(`/audio?id=${item.evidenceId}&seek=${item.startTime}&q=${encodeURIComponent(query)}`);
    } else {
      navigate(`/document?id=${item.evidenceId}&page=${item.pageNumber}&q=${encodeURIComponent(query)}`);
    }
  };

  const renderHighlightedSnippet = (context: string, queryStr: string) => {
    if (!queryStr.trim()) return context;
    const tokens = queryStr.split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (tokens.length === 0) return context;

    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = context.split(regex);

    return parts.map((part, i) =>
      tokens.some(t => t.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="bg-blue-600/30 text-blue-200 font-medium px-1 py-0.5 rounded border border-blue-500/40">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition flex flex-col justify-between gap-3 group">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {item.type === 'audio' ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950/60 text-blue-400 border border-blue-900/60 flex items-center gap-1">
                <Headphones className="w-3 h-3" />
                Audio Recording
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-950/60 text-indigo-400 border border-indigo-900/60 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Document Exhibit
              </span>
            )}

            {item.type === 'audio' && item.speakerLabel && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {item.speakerLabel}
              </span>
            )}

            {item.type === 'document' && item.isOcr && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/60 text-amber-400 border border-amber-900/60 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                OCR
              </span>
            )}
          </div>

          {/* Location Pointer Badge */}
          {item.type === 'audio' ? (
            <span className="text-xs font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatSecondsToTimestamp(item.startTime)}
              {item.isApproximateTimestamp && <span className="text-[10px] text-slate-400">(approx)</span>}
            </span>
          ) : (
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
              Page {item.pageNumber}
            </span>
          )}
        </div>

        {/* File Name & Heading */}
        <h3 className="text-sm font-medium text-slate-200 group-hover:text-blue-300 transition">
          {item.fileName}
        </h3>
        {item.type === 'document' && item.sectionHeading && (
          <div className="text-xs font-medium text-slate-400 mt-0.5">
            {item.sectionHeading}
          </div>
        )}

        {/* Surrounding Context Quote */}
        <div className="mt-2.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-serif select-text">
          "{renderHighlightedSnippet(item.surroundingContext, query)}"
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 font-mono">
          Relevance: {Math.round(item.score)}%
        </div>

        <button
          onClick={handleAction}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
        >
          {item.type === 'audio' ? (
            <>
              <Play className="w-3 h-3 fill-white" />
              <span>Jump to {formatSecondsToTimestamp(item.startTime)}</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-3 h-3" />
              <span>Inspect Page {item.pageNumber}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
