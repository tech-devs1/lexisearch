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
        <mark key={i} className="bg-gray-200 text-gray-950 font-semibold px-1 py-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-4 transition flex flex-col justify-between gap-3 group shadow-xs">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {item.type === 'audio' ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 font-medium">
                <Headphones className="w-3 h-3" />
                Audio Recording
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 font-medium">
                <FileText className="w-3 h-3" />
                Document Exhibit
              </span>
            )}

            {item.type === 'audio' && item.speakerLabel && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200">
                {item.speakerLabel}
              </span>
            )}

            {item.type === 'document' && item.isOcr && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3 h-3" />
                OCR
              </span>
            )}
          </div>

          {/* Location Pointer Badge */}
          {item.type === 'audio' ? (
            <span className="text-xs font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-gray-500" />
              {formatSecondsToTimestamp(item.startTime)}
              {item.isApproximateTimestamp && <span className="text-[10px] text-gray-400 font-normal">(approx)</span>}
            </span>
          ) : (
            <span className="text-xs font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-medium">
              Page {item.pageNumber}
            </span>
          )}
        </div>

        {/* File Name & Heading */}
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-black transition">
          {item.fileName}
        </h3>
        {item.type === 'document' && item.sectionHeading && (
          <div className="text-xs font-medium text-gray-500 mt-0.5">
            {item.sectionHeading}
          </div>
        )}

        {/* Surrounding Context Quote */}
        <div className="mt-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800 leading-relaxed font-serif select-text">
          "{renderHighlightedSnippet(item.surroundingContext, query)}"
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="text-[11px] text-gray-500 font-mono">
          Relevance: {Math.round(item.score)}%
        </div>

        <button
          onClick={handleAction}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white shadow-xs"
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
