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
        <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 shadow-xs">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {evidenceId ? 'Documentary Exhibit Restricted' : 'No Document Evidence Selected'}
        </h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          {evidenceId
            ? 'Access to this legal exhibit is restricted to authorized case counsel. Judicial authorization was revoked or not assigned.'
            : 'Please select an authorized document exhibit from Case Management or upload an exhibit (PDF, DOCX) to inspect.'}
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
