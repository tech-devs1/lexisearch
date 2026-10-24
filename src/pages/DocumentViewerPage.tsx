import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { DocumentViewer } from '../components/document/DocumentViewer';
import { useCase } from '../context/CaseContext';

export const DocumentViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const evidenceId = searchParams.get('id');
  const pageNumber = parseInt(searchParams.get('page') || '1', 10);
  const highlightQuery = searchParams.get('q') || '';

  const { evidenceList, getEvidenceById } = useCase();

  // Find document file: either from URL query id, or first document in active case
  const docEvidence = evidenceId
    ? getEvidenceById(evidenceId)
    : evidenceList.find((e) => e.fileType === 'document') || evidenceList[0];

  if (!docEvidence || docEvidence.fileType !== 'document') {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-200">No Document Evidence Selected</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please select a document exhibit from Case Management or upload a PDF, DOCX, or scanned exhibit.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      <DocumentViewer
        evidence={docEvidence}
        initialPage={pageNumber}
        highlightQuery={highlightQuery}
      />
    </div>
  );
};
