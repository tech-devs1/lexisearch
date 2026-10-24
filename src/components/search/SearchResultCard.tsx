import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Headphones, 
  FileText, 
  Play, 
  ExternalLink, 
  Clock, 
  Bookmark, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { SearchResultItem } from '../../types/search';
import { formatSecondsToTimestamp } from '../../services/audioProcessor';
import { formatHashTruncated } from '../../services/crypto';

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
        <mark key={i} className="bg-amber-400 text-slate-950 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 lg:p-5 shadow-lg transition flex flex-col justify-between gap-3 group">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {item.type === 'audio' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Headphones className="w-3 h-3" />
                Audio Recording
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Document Exhibit
              </span>
            )}

            {item.type === 'audio' && item.speakerLabel && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {item.speakerLabel}
              </span>
            )}

            {item.type === 'document' && item.isOcr && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                OCR Extracted
              </span>
            )}
          </div>

          {/* Location Pointer Badge */}
          {item.type === 'audio' ? (
            <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatSecondsToTimestamp(item.startTime)}
              {item.isApproximateTimestamp && <span className="text-[10px] text-slate-400">(approx)</span>}
            </span>
          ) : (
            <span className="text-xs font-mono font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Page {item.pageNumber}
            </span>
          )}
        </div>

        {/* File Name & Heading */}
        <h3 className="text-sm font-bold text-slate-200 group-hover:text-amber-300 transition">
          {item.fileName}
        </h3>
        {item.type === 'document' && item.sectionHeading && (
          <div className="text-xs font-medium text-amber-500/80 mt-0.5">
            {item.sectionHeading}
          </div>
        )}

        {/* Surrounding Context Quote */}
        <div className="mt-2.5 p-3 rounded-lg bg-slate-850 border border-slate-800 text-xs text-slate-300 leading-relaxed font-serif select-text">
          "{renderHighlightedSnippet(item.surroundingContext, query)}"
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 font-mono">
          Score: {Math.round(item.score)}%
        </div>

        <button
          onClick={handleAction}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow bg-amber-500 hover:bg-amber-400 text-slate-950"
        >
          {item.type === 'audio' ? (
            <>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Play at {formatSecondsToTimestamp(item.startTime)}</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Document at Page {item.pageNumber}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
