import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Bookmark, 
  AlertTriangle, 
  ShieldCheck, 
  FileText
} from 'lucide-react';
import { EvidenceFile, DocumentPage } from '../../types/evidence';
import { formatHashTruncated } from '../../services/crypto';
import { useCase } from '../../context/CaseContext';

interface DocumentViewerProps {
  evidence: EvidenceFile;
  initialPage?: number;
  highlightQuery?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  evidence,
  initialPage = 1,
  highlightQuery = '',
}) => {
  const { addBookmark } = useCase();
  const [currentPageNum, setCurrentPageNum] = useState(initialPage);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [bookmarkSuccess, setBookmarkSuccess] = useState(false);

  useEffect(() => {
    if (initialPage > 0) {
      setCurrentPageNum(initialPage);
    }
  }, [initialPage]);

  const totalPages = evidence.pageCount || evidence.pages?.length || 1;
  const currentPage: DocumentPage | undefined = evidence.pages?.find(
    (p) => p.pageNumber === currentPageNum
  ) || evidence.pages?.[0];

  const handlePrevPage = () => {
    setCurrentPageNum((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPageNum((p) => Math.min(totalPages, p + 1));
  };

  const handleCreateBookmark = async () => {
    if (!currentPage) return;
    await addBookmark({
      caseId: evidence.caseId,
      evidenceId: evidence.id,
      fileName: evidence.fileName,
      type: 'document',
      pageNumber: currentPage.pageNumber,
      passageSnippet: currentPage.text.slice(0, 180) + '...',
      note: `Bookmarked from Document Viewer (Page ${currentPage.pageNumber}).`,
      tags: ['Exhibit', `Page ${currentPage.pageNumber}`],
    });

    setBookmarkSuccess(true);
    setTimeout(() => setBookmarkSuccess(false), 2500);
  };

  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-gray-200 text-gray-950 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full">
      {/* Viewer Header */}
      <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
              Legal Document / Exhibit
            </span>
            <span className="text-xs text-gray-500 font-mono">
              SHA-256: {formatHashTruncated(evidence.sha256Hash, 8)}
            </span>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mt-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-700" />
            {evidence.fileName}
          </h2>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1 text-gray-600 hover:text-gray-900"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-gray-800 px-2">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 text-gray-600 hover:text-gray-900"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
            <button
              onClick={handlePrevPage}
              disabled={currentPageNum <= 1}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-40"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-gray-800 px-3">
              Page {currentPageNum} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPageNum >= totalPages}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-40"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleCreateBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              bookmarkSuccess
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-gray-900 hover:bg-black text-white shadow-xs'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{bookmarkSuccess ? 'Bookmarked!' : 'Bookmark Page'}</span>
          </button>
        </div>
      </div>

      {/* OCR Warning Banner if low confidence */}
      {currentPage?.hasWarnings && (
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-3 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <div>
            <span className="font-semibold">Notice: Low OCR Confidence ({currentPage.ocrConfidence}%):</span>{' '}
            Handwritten cursive, rubber stamps, or document aging detected. Inspect original physical or high-res scan for forensic accuracy.
          </div>
        </div>
      )}

      {/* Document Page Reader Viewport */}
      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto flex justify-center">
        <div
          className="bg-white border border-gray-200 rounded-xl shadow-xs p-8 max-w-3xl w-full min-h-[500px] flex flex-col justify-between transition-all"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          <div>
            {/* Document Header Line */}
            <div className="border-b border-gray-200 pb-3 mb-6 flex items-center justify-between text-xs text-gray-500 font-mono">
              <span className="uppercase tracking-widest text-[11px] text-gray-700 font-semibold font-mono">
                SUPERIOR COURT EXHIBIT RECORD
              </span>
              <span>PAGE {currentPageNum} OF {totalPages}</span>
            </div>

            {/* Section Headings */}
            {currentPage?.headings && currentPage.headings.length > 0 && (
              <div className="mb-4 space-y-1">
                {currentPage.headings.map((h, i) => (
                  <div key={i} className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    {h}
                  </div>
                ))}
              </div>
            )}

            {/* Extracted Page Body Text */}
            <div className="font-serif text-gray-900 text-sm leading-relaxed whitespace-pre-wrap select-text">
              {currentPage ? (
                renderHighlightedText(currentPage.text, highlightQuery)
              ) : (
                <div className="text-gray-400 italic">No text recorded on this page.</div>
              )}
            </div>
          </div>

          {/* Page Footer Seal */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Evidence Sealed: {evidence.sha256Hash.slice(0, 16)}...
            </span>
            <span>Ghana Evidence Act, 1975 (NRCD 323)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
